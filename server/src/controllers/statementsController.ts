import { Response, NextFunction } from 'express';
import fs from 'fs';
import { AuthenticatedRequest } from '../types';
import { extractTextFromPdf } from '../services/pdfParser';
import { parseTransactionsFromText, parseTransactionsFromImages } from '../services/aiParser';
import { pdfToBase64Images } from '../services/pdfToImages';
import { supabase } from '../config/supabase';

export async function uploadStatement(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  try {
    const rawText = await extractTextFromPdf(file.path);
    const isScanned = !rawText || rawText.trim().length < 50;

    let transactions, bankName, periodStart, periodEnd;

    if (isScanned) {
      // Scanned (image-based) PDF — render pages and use GPT-4o vision
      console.log('[INFO] Scanned PDF detected, switching to vision-based parsing');
      const images = await pdfToBase64Images(file.path);
      if (images.length === 0) {
        res.status(422).json({ error: 'Could not render this PDF. Please try a different file.' });
        return;
      }
      ({ transactions, bankName, periodStart, periodEnd } = await parseTransactionsFromImages(images));
    } else {
      // Text-based PDF — fast text extraction path
      ({ transactions, bankName, periodStart, periodEnd } = await parseTransactionsFromText(rawText));
    }

    // Insert statement record
    const { data: statement, error: stmtError } = await supabase
      .from('bank_statements')
      .insert({
        user_id: req.userId,
        filename: file.originalname,
        bank_name: bankName,
        statement_period_start: periodStart,
        statement_period_end: periodEnd,
      })
      .select()
      .single();

    if (stmtError) throw stmtError;

    if (transactions.length > 0) {
      const rows = transactions.map((t) => ({
        user_id: req.userId,
        statement_id: statement.id,
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.category,
      }));

      const { error: txError } = await supabase.from('transactions').insert(rows);
      if (txError) throw txError;
    }

    res.json({
      statement,
      transactionCount: transactions.length,
    });
  } catch (err) {
    next(err);
  } finally {
    // Clean up temp file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  }
}

export async function getStatements(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('bank_statements')
      .select('*')
      .eq('user_id', req.userId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function deleteStatement(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('bank_statements')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
