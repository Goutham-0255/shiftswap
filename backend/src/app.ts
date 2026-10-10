import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { requestLogger } from './middleware/requestLogger';
import { historyRoutes } from './modules/history/history.routes';
import { listingRoutes } from './modules/listings/listing.routes';
import { shiftsRoutes } from './modules/shifts/shifts.routes';
import { staffRoutes } from './modules/staff/staff.routes';

// Building the app in a function (separate from listen()) lets tests use it directly.
export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigins }));
  app.use(express.json({ limit: '1mb' }));
  app.use(requestLogger);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/api/staff', staffRoutes());
  app.use('/api/shifts', shiftsRoutes());
  app.use('/api/listings', listingRoutes());
  app.use('/api/history', historyRoutes());

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
