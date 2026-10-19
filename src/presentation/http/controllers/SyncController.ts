import { Request, Response, NextFunction } from 'express';
import { ApplicationContainer } from '../../../infrastructure/di/container';
import { serializeSyncRun, serializeProgress } from '../serializers/serializers';

export class SyncController {
  constructor(private readonly container: ApplicationContainer) {}

  run = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const run = await this.container.useCases.runSynchronization.execute({
        simulation: req.body?.simulation ?? this.container.config.sync.simulationMode,
        courseConfigId: req.body?.courseConfigId,
        syncStudents: req.body?.syncStudents,
        certificationCycle: req.body?.certificationCycle,
        concurrency: req.body?.concurrency ?? this.container.config.sync.concurrency,
      });
      res.status(202).json({ success: true, data: serializeSyncRun(run) });
    } catch (e) {
      next(e);
    }
  };

  getRun = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const run = await this.container.useCases.querySyncRun.byId(req.params.id);
      res.json({ success: true, data: serializeSyncRun(run) });
    } catch (e) {
      next(e);
    }
  };

  listRuns = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const runs = await this.container.useCases.querySyncRun.recent();
      res.json({ success: true, data: runs.map(serializeSyncRun) });
    } catch (e) {
      next(e);
    }
  };

  report = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const report = await this.container.useCases.generateSyncReport.execute(
        req.params.id,
      );
      res.json({ success: true, data: report });
    } catch (e) {
      next(e);
    }
  };

  progress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.query.studentId && req.query.courseConfigId) {
        const p = await this.container.useCases.queryAcademicProgress.byStudentAndCourse(
          String(req.query.studentId),
          String(req.query.courseConfigId),
        );
        res.json({ success: true, data: serializeProgress(p) });
        return;
      }
      if (req.query.courseConfigId) {
        const list = await this.container.useCases.queryAcademicProgress.byCourse(
          String(req.query.courseConfigId),
        );
        res.json({ success: true, data: list.map(serializeProgress) });
        return;
      }
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'courseConfigId is required',
        },
      });
    } catch (e) {
      next(e);
    }
  };
}
