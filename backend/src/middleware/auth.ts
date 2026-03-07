import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // Allow token via query param for SSE endpoints (EventSource can't set headers)
  const queryToken = req.query.token as string | undefined;
  const authHeader = req.headers.authorization;

  const token = queryToken ?? (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);

  if (!token) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}
