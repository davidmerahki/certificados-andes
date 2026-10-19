import cron from 'node-cron';
import { RunSynchronizationUseCase } from '../../application/use-cases/sync/RunSynchronizationUseCase';
import { ILogger } from '../../domain/ports/ILogger';

/**
 * Scheduled task adapter — invokes use cases only.
 * Contains no business logic of its own.
 */
export class NightlySyncScheduler {
  private task: cron.ScheduledTask | null = null;

  constructor(
    private readonly runSynchronization: RunSynchronizationUseCase,
    private readonly cronExpression: string,
    private readonly simulationMode: boolean,
    private readonly concurrency: number,
    private readonly logger: ILogger,
  ) {}

  start(): void {
    if (!cron.validate(this.cronExpression)) {
      this.logger.error('Invalid cron expression', {
        cron: this.cronExpression,
      });
      return;
    }

    this.task = cron.schedule(this.cronExpression, async () => {
      this.logger.info('Nightly sync triggered by scheduler');
      try {
        const run = await this.runSynchronization.execute({
          simulation: this.simulationMode,
          concurrency: this.concurrency,
        });
        this.logger.info('Nightly sync completed', {
          syncRunId: run.id,
          status: run.status,
        });
      } catch (e) {
        this.logger.error('Nightly sync failed', {
          error: e instanceof Error ? e.message : String(e),
        });
      }
    });

    this.logger.info('Nightly sync scheduler started', {
      cron: this.cronExpression,
      simulationMode: this.simulationMode,
    });
  }

  stop(): void {
    this.task?.stop();
    this.task = null;
  }
}
