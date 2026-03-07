import { Request, Response, NextFunction } from 'express';
import { redis } from '../../config/redis';
import { CreateSearchSchema } from './search.schema';
import * as searchService from './search.service';

export async function createSearch(req: Request, res: Response, next: NextFunction) {
  try {
    const { query, region, countryCode } = CreateSearchSchema.parse(req.body);
    const session = await searchService.createSearchSession(req.user!.companyId, query, region, countryCode);
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
}

export async function getSearch(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await searchService.getSearchSession(req.params.id, req.user!.companyId);
    res.json(session);
  } catch (err) {
    next(err);
  }
}

export async function streamSearch(req: Request, res: Response) {
  const { id } = req.params;
  const companyId = req.user!.companyId;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const channel = `search:${id}`;
  const subscriber = redis.duplicate();
  await subscriber.subscribe(channel);

  subscriber.on('message', (_chan: string, message: string) => {
    try {
      const parsed = JSON.parse(message) as { event: string; data: Record<string, unknown> };
      res.write(`event: ${parsed.event}\ndata: ${JSON.stringify(parsed.data)}\n\n`);

      if (parsed.event === 'completed' || parsed.event === 'failed') {
        cleanup();
      }
    } catch {
      // ignore parse errors
    }
  });

  const keepAlive = setInterval(() => {
    res.write(':heartbeat\n\n');
  }, 15000);

  function cleanup() {
    clearInterval(keepAlive);
    void subscriber.unsubscribe(channel);
    void subscriber.quit();
    res.end();
  }

  // Check if already completed
  const session = await searchService.getSearchSession(id, companyId).catch(() => null);
  if (session && (session.status === 'COMPLETED' || session.status === 'FAILED')) {
    res.write(
      `event: ${session.status.toLowerCase()}\ndata: ${JSON.stringify({ message: 'Already finished' })}\n\n`,
    );
    cleanup();
    return;
  }

  req.on('close', cleanup);
}

export async function getHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await searchService.getSearchHistory(req.user!.companyId, req.query as Record<string, unknown>);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function deleteSearch(req: Request, res: Response, next: NextFunction) {
  try {
    await searchService.deleteSearchSession(req.params.id, req.user!.companyId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
