import type { ErrorRequestHandler } from 'express';
import { AppError } from '../lib/AppError';

// Single place where every error ends up. Express 5 forwards errors thrown in
// async handlers here automatically, so controllers never need try/catch.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { message: err.message, details: err.details } });
    return;
  }

  // Unknown error: log the full thing, but never leak internals to the client.
  console.error('Unhandled error', err);
  res.status(500).json({ error: { message: 'Internal server error' } });
};
