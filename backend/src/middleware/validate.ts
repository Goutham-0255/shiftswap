import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../lib/AppError';

type Schemas = { body?: ZodType; query?: ZodType; params?: ZodType };

// Validates request input against Zod schemas before it reaches the controller.
// Parsed (typed, coerced) values are stored on res.locals.
export const validate =
  (schemas: Schemas): RequestHandler =>
  (req, res, next) => {
    for (const key of ['body', 'query', 'params'] as const) {
      const schema = schemas[key];
      if (!schema) continue;

      const result = schema.safeParse(req[key]);
      if (!result.success) {
        throw AppError.badRequest('Validation failed', result.error.issues);
      }
      res.locals[key] = result.data;
    }
    next();
  };
