import express, { Express } from 'express';
import cors from 'cors';
import { ApplicationContainer } from '../../infrastructure/di/container';
import { createApiRouter } from './routes';
import { createErrorHandler } from './middlewares/errorHandler';

export interface CreateAppOptions {
  /** Lazy readiness (e.g. Mongo connect) — needed on Vercel serverless */
  ensureReady?: () => Promise<void>;
}

export function createApp(
  container: ApplicationContainer,
  options: CreateAppOptions = {},
): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Public probes — no DB required (so Vercel health works even if Mongo is misconfigured)
  app.get('/', (_req, res) => {
    res.json({
      success: true,
      service: 'certificados-andes',
      message: 'API de certificación LearnWorlds → POK',
      health: '/api/health',
    });
  });
  app.get('/api/health', (_req, res) => {
    res.json({ success: true, message: 'API funcionando correctamente' });
  });

  if (options.ensureReady) {
    app.use(async (_req, _res, next) => {
      try {
        await options.ensureReady!();
        next();
      } catch (err) {
        next(err);
      }
    });
  }

  app.use('/api', createApiRouter(container));
  app.use(createErrorHandler(container.logger));
  return app;
}
