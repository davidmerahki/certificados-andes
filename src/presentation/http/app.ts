import express, { Express } from 'express';
import cors from 'cors';
import { ApplicationContainer } from '../../infrastructure/di/container';
import { createApiRouter } from './routes';
import { createErrorHandler } from './middlewares/errorHandler';

export function createApp(container: ApplicationContainer): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api', createApiRouter(container));
  app.use(createErrorHandler(container.logger));
  return app;
}
