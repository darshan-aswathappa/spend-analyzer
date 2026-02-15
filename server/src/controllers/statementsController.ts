import { Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { AuthenticatedRequest } from '../types';
import { supabase } from '../config/supabase';
import { getRabbitChannel, getQueueName } from '../config/rabbitmq';
import { recalculateAndSaveRiskScore } from '../services/riskScoringService';

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
    // Check if user has any existing statements (to auto-set default)
    const { count } = await supabase
      .from('bank_statements')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.userId);

    const shouldBeDefault = count === 0;

    // Insert statement with pending status
    const { data: statement, error: stmtError } = await supabase
      .from('bank_statements')
      .insert({
        user_id: req.userId,
        filename: file.originalname,
        processing_status: 'pending',
        file_path: file.path,
        is_default: shouldBeDefault,
      })
      .select()
      .single();

    if (stmtError) throw stmtError;

    // Publish to RabbitMQ
    const channel = await getRabbitChannel();
    channel.sendToQueue(
      getQueueName(),
      Buffer.from(JSON.stringify({
        statementId: statement.id,
        userId: req.userId,
        filePath: file.path,
        filename: file.originalname,
      })),
      { persistent: true }
    );

    res.json({
      statement,
      status: 'queued',
      estimatedMinutes: 1,
    });
  } catch (err) {
    // If queueing fails, clean up the file
    if (file && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    next(err);
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

    // Check if the statement being deleted is the default, and get file_path for cleanup
    const { data: toDelete } = await supabase
      .from('bank_statements')
      .select('is_default, file_path')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    const { error } = await supabase
      .from('bank_statements')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);

    if (error) throw error;

    // Clean up file from disk
    if (toDelete?.file_path && fs.existsSync(toDelete.file_path)) {
      fs.unlinkSync(toDelete.file_path);
    }

    // If deleted statement was default, promote the most recent remaining one
    if (toDelete?.is_default) {
      const { data: remaining } = await supabase
        .from('bank_statements')
        .select('id')
        .eq('user_id', req.userId)
        .order('uploaded_at', { ascending: false })
        .limit(1);

      if (remaining && remaining.length > 0) {
        await supabase
          .from('bank_statements')
          .update({ is_default: true })
          .eq('id', remaining[0].id);
      }
    }

    // Recalculate risk score since transactions were removed
    try {
      const newScore = await recalculateAndSaveRiskScore(req.userId);
      if (newScore) {
        await supabase.from('notifications').insert({
          user_id: req.userId,
          type: 'risk_score_updated',
          payload: {
            overall_score: newScore.overall_score,
            rating: newScore.rating,
          },
        });
      }
    } catch (riskErr) {
      console.error('[Statements] Risk score recalculation after delete failed:', riskErr);
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function viewStatementPdf(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const { data: statement, error } = await supabase
      .from('bank_statements')
      .select('file_path')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (error || !statement) {
      res.status(404).json({ error: 'Statement not found' });
      return;
    }

    if (!statement.file_path || !fs.existsSync(statement.file_path)) {
      res.status(404).json({ error: 'File not available' });
      return;
    }

    const absolutePath = path.resolve(statement.file_path);
    res.sendFile(absolutePath, { headers: { 'Content-Type': 'application/pdf' } });
  } catch (err) {
    next(err);
  }
}

export async function setDefaultStatement(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    // Unset all defaults for this user
    await supabase
      .from('bank_statements')
      .update({ is_default: false })
      .eq('user_id', req.userId);

    // Set the chosen statement as default
    const { data, error } = await supabase
      .from('bank_statements')
      .update({ is_default: true })
      .eq('id', id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
}
