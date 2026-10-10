import type { RequestHandler } from 'express';
import { env } from '../config/env';

// Logs method, URL, status and response time for every request.
export const requestLogger: RequestHandler = (req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    if (env.NODE_ENV === 'test') return;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - startedAt}ms`);
  });
  next();
};
