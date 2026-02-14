import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { streamChatResponse } from '../services/chatService';
import { supabase } from '../config/supabase';

export async function chat(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }
    await streamChatResponse(req.userId, message.trim(), res);
  } catch (err) {
    next(err);
  }
}

export async function getChatHistory(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function clearChatHistory(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', req.userId);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
