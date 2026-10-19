import { createContainer } from './infrastructure/di/container';
import { connectDatabase } from './infrastructure/config/database';
import { createApp } from './presentation/http/app';
import { NightlySyncScheduler } from './infrastructure/scheduling/NightlySyncScheduler';

async function bootstrap() {
  const container = createContainer();
  await connectDatabase(container.config.mongoUri, container.logger);

  const app = createApp(container);

  const scheduler = new NightlySyncScheduler(
    container.useCases.runSynchronization,
    container.config.sync.cron,
    container.config.sync.simulationMode,
    container.config.sync.concurrency,
    container.logger,
  );
  scheduler.start();

  app.listen(container.config.port, () => {
    container.logger.info(`Server running on http://localhost:${container.config.port}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
