import { Request, Response, NextFunction } from 'express';
import { ApplicationContainer } from '../../../infrastructure/di/container';
import {
  serializeCourse,
  serializeCertification,
  serializeSyncRun,
} from '../serializers/serializers';

export class CourseController {
  constructor(private readonly container: ApplicationContainer) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const course = await this.container.useCases.registerCourse.execute(req.body);
      res.status(201).json({ success: true, data: serializeCourse(course) });
    } catch (e) {
      next(e);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = req.query.status as
        | 'active'
        | 'inactive'
        | 'archived'
        | 'draft'
        | undefined;
      const courses = await this.container.useCases.listCourses.execute(
        status ? { status } : undefined,
      );
      res.json({ success: true, data: courses.map(serializeCourse) });
    } catch (e) {
      next(e);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const course = await this.container.useCases.updateCourseConfig.execute({
        courseId: req.params.id,
        ...req.body,
      });
      res.json({ success: true, data: serializeCourse(course) });
    } catch (e) {
      next(e);
    }
  };

  activate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const course = await this.container.useCases.activateCourse.execute(
        req.params.id,
      );
      res.json({ success: true, data: serializeCourse(course) });
    } catch (e) {
      next(e);
    }
  };

  deactivate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const archive = req.body?.archive === true;
      const course = await this.container.useCases.deactivateCourse.execute(
        req.params.id,
        archive,
      );
      res.json({ success: true, data: serializeCourse(course) });
    } catch (e) {
      next(e);
    }
  };

  associateTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const course = await this.container.useCases.associatePokTemplate.execute({
        courseId: req.params.id,
        pokTemplateId: req.body.pokTemplateId,
        emitterOrganization: req.body.emitterOrganization,
        validateRemote: req.body.validateRemote,
      });
      res.json({ success: true, data: serializeCourse(course) });
    } catch (e) {
      next(e);
    }
  };

  validate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const report = await this.container.useCases.validateCourseConfig.execute(
        req.params.id,
      );
      res.json({ success: true, data: report });
    } catch (e) {
      next(e);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const course = await this.container.useCases.getCourse.execute(req.params.id);
      res.json({ success: true, data: serializeCourse(course) });
    } catch (e) {
      next(e);
    }
  };

  simulate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const course = await this.container.useCases.getCourse.execute(req.params.id);
      const result = await this.container.useCases.simulateEmissions.execute(
        course,
        req.body?.certificationCycle,
      );
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  };

  emissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const list =
        await this.container.useCases.queryCertificationHistory.byCourse(
          req.params.id,
        );
      res.json({
        success: true,
        data: list.map(serializeCertification),
      });
    } catch (e) {
      next(e);
    }
  };

  syncHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const runs = await this.container.useCases.querySyncRun.byCourse(
        req.params.id,
      );
      res.json({ success: true, data: runs.map(serializeSyncRun) });
    } catch (e) {
      next(e);
    }
  };
}
