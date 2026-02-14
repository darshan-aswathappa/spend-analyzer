import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof Error) {
    console.error('[ERROR]', err.message, err.stack);
    res.status(500).json({ error: err.message });
  } else if (err && typeof err === 'object') {
    // Supabase PostgrestError and similar
    const e = err as Record<string, unknown>;
    console.error('[SUPABASE ERROR]', JSON.stringify(e, null, 2));
    const message = (e.message as string) || (e.error_description as string) || 'Database error';
    res.status(500).json({ error: message, details: e.details, hint: e.hint, code: e.code });
  } else {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
