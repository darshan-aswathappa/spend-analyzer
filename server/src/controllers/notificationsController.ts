import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { supabase } from '../config/supabase';

export async function getNotifications(
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', req.userId)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json(data ?? []);
}

export async function streamNotifications(
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // Send initial heartbeat
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  const interval = setInterval(async () => {
    try {
      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', req.userId)
        .eq('read', false)
        .order('created_at', { ascending: true });

      if (notifications && notifications.length > 0) {
        for (const notif of notifications) {
          res.write(`data: ${JSON.stringify(notif)}\n\n`);
        }
        // Mark as read
        const ids = notifications.map((n) => n.id);
        await supabase
          .from('notifications')
          .update({ read: true })
          .in('id', ids);
      }
    } catch {
      // Silently continue on polling error
    }
  }, 3000);

  req.on('close', () => {
    clearInterval(interval);
  });
}
