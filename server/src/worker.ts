import { getRabbitChannel, getQueueName, closeRabbitConnection } from './config/rabbitmq';
import { supabase } from './config/supabase';
import { extractTextFromPdf } from './services/pdfParser';
import { parseTransactionsFromText, parseTransactionsFromImages } from './services/aiParser';
import { pdfToBase64Images } from './services/pdfToImages';
import { validateEnv } from './config/env';
import fs from 'fs';

validateEnv();

async function start() {
  const channel = await getRabbitChannel();
  const queue = getQueueName();

  console.log('[Worker] Waiting for PDF processing jobs...');

  channel.prefetch(1);

  channel.consume(queue, async (msg) => {
    if (!msg) return;

    const { statementId, userId, filePath, filename } = JSON.parse(msg.content.toString());
    console.log(`[Worker] Processing statement ${statementId} (${filename})`);

    try {
      // Mark as processing
      await supabase
        .from('bank_statements')
        .update({ processing_status: 'processing' })
        .eq('id', statementId);

      // Extract text from PDF
      const rawText = await extractTextFromPdf(filePath);
      const isScanned = !rawText || rawText.trim().length < 50;

      let transactions, bankName, periodStart, periodEnd;

      if (isScanned) {
        console.log(`[Worker] Scanned PDF detected for ${statementId}, using vision`);
        const images = await pdfToBase64Images(filePath);
        if (images.length === 0) {
          throw new Error('Could not render this PDF. Please try a different file.');
        }
        ({ transactions, bankName, periodStart, periodEnd } = await parseTransactionsFromImages(images));
      } else {
        ({ transactions, bankName, periodStart, periodEnd } = await parseTransactionsFromText(rawText));
      }

      // Update statement with parsed metadata
      await supabase
        .from('bank_statements')
        .update({
          bank_name: bankName,
          statement_period_start: periodStart,
          statement_period_end: periodEnd,
          processing_status: 'completed',
          processing_error: null,
        })
        .eq('id', statementId);

      // Insert transactions
      if (transactions.length > 0) {
        const rows = transactions.map((t) => ({
          user_id: userId,
          statement_id: statementId,
          date: t.date,
          description: t.description,
          amount: t.amount,
          type: t.type,
          category: t.category,
        }));
        const { error: txError } = await supabase.from('transactions').insert(rows);
        if (txError) throw txError;
      }

      // Create success notification
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'statement_processed',
        payload: {
          statementId,
          filename,
          transactionCount: transactions.length,
        },
      });

      console.log(`[Worker] Completed ${statementId}: ${transactions.length} transactions`);
      channel.ack(msg);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Worker] Failed ${statementId}:`, message);

      await supabase
        .from('bank_statements')
        .update({
          processing_status: 'failed',
          processing_error: message,
        })
        .eq('id', statementId);

      // Create failure notification
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'statement_failed',
        payload: { statementId, filename, error: message },
      });

      channel.ack(msg);
    } finally {
      // Clean up temp file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  });
}

start().catch((err) => {
  console.error('[Worker] Fatal error:', err);
  process.exit(1);
});

process.on('SIGINT', async () => {
  console.log('[Worker] Shutting down...');
  await closeRabbitConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[Worker] Shutting down...');
  await closeRabbitConnection();
  process.exit(0);
});
