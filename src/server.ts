import { createContainer } from './infrastructure/di/container';
import { connectDatabase } from './infrastructure/config/database';
import { createApp } from './presentation/http/app';
import { NightlySyncScheduler } from './infrastructure/scheduling/NightlySyncScheduler';

const container = createContainer();

let dbReady: Promise<void> | null = null;

async function ensureDatabase(): Promise<void> {
  if (!dbReady) {
    dbReady = connectDatabase(container.config.mongoUri, container.logger);
  }
  await dbReady;
}

const app = createApp(container, { ensureReady: ensureDatabase });

/** Vercel Express entry — default export (no listen required). */
export default app;

const isVercel = Boolean(process.env.VERCEL);

if (!isVercel) {
  ensureDatabase()
    .then(() => {
      const scheduler = new NightlySyncScheduler(
        container.useCases.runSynchronization,
        container.config.sync.cron,
        container.config.sync.simulationMode,
        container.config.sync.concurrency,
        container.logger,
      );
      scheduler.start();

      app.listen(container.config.port, () => {
        container.logger.info(
          `Server running on http://localhost:${container.config.port}`,
        );
      });
    })
    .catch((err) => {
      console.error('Failed to start server', err);
      process.exit(1);
    });
}
