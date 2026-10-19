import { Request, Response, NextFunction } from 'express';
import { ApplicationContainer } from '../../../infrastructure/di/container';
import { serializeCertification } from '../serializers/serializers';

export class CertificationController {
  constructor(private readonly container: ApplicationContainer) {}

  emit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cert = await this.container.useCases.emitCredential.execute({
        studentId: req.body.studentId,
        courseConfigId: req.body.courseConfigId,
        certificationCycle: req.body.certificationCycle,
        simulation: req.body.simulation,
      });
      res.status(201).json({ success: true, data: serializeCertification(cert) });
    } catch (e) {
      next(e);
    }
  };

  emitByEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cert = await this.container.useCases.emitCredentialByEmail.execute({
        email: req.body.email,
        courseConfigId: req.body.courseConfigId,
        learnWorldsCourseId: req.body.learnWorldsCourseId,
        certificationCycle: req.body.certificationCycle,
        simulation: req.body.simulation === true,
      });
      res.status(201).json({ success: true, data: serializeCertification(cert) });
    } catch (e) {
      next(e);
    }
  };

  status = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const view = await this.container.useCases.queryEmissionStatus.execute(
        req.params.id,
      );
      res.json({
        success: true,
        data: {
          ...serializeCertification(view.certification),
          pokState: view.pokState,
        },
      });
    } catch (e) {
      next(e);
    }
  };

  retry = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cert = await this.container.useCases.retryFailedEmission.execute(
        req.params.id,
      );
      res.json({ success: true, data: serializeCertification(cert) });
    } catch (e) {
      next(e);
    }
  };

  history = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const list = await this.container.useCases.queryCertificationHistory.execute({
        courseConfigId: req.query.courseConfigId
          ? String(req.query.courseConfigId)
          : undefined,
        studentId: req.query.studentId
          ? String(req.query.studentId)
          : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
      });
      res.json({ success: true, data: list.map(serializeCertification) });
    } catch (e) {
      next(e);
    }
  };

  eligible = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const course = await this.container.useCases.getCourse.execute(
        req.params.courseId,
      );
      const candidates = await this.container.useCases.identifyEligible.execute(
        course,
        req.query.cycle ? String(req.query.cycle) : undefined,
      );
      res.json({
        success: true,
        data: candidates.map((c) => ({
          studentId: c.student.id,
          email: c.student.email,
          fullName: c.student.fullName,
          progressRate: c.progress.progressRate,
          courseConfigId: c.course.id,
          certificationCycle: c.certificationCycle,
          pokTemplateId: c.course.pokTemplateId,
        })),
      });
    } catch (e) {
      next(e);
    }
  };
}
