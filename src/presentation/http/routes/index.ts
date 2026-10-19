import { Router } from 'express';
import { ApplicationContainer } from '../../../infrastructure/di/container';
import { createAdminAuth } from '../middlewares/auth';
import { CourseController } from '../controllers/CourseController';
import { SyncController } from '../controllers/SyncController';
import { CertificationController } from '../controllers/CertificationController';

export function createApiRouter(container: ApplicationContainer): Router {
  const router = Router();
  const auth = createAdminAuth(container.config.adminApiKey);
  const courses = new CourseController(container);
  const sync = new SyncController(container);
  const certs = new CertificationController(container);

  router.get('/health', (_req, res) => {
    res.json({ success: true, message: 'API funcionando correctamente' });
  });

  // Courses (admin)
  router.post('/courses', auth, courses.register);
  router.get('/courses', auth, courses.list);
  router.get('/courses/:id', auth, courses.get);
  router.patch('/courses/:id', auth, courses.update);
  router.post('/courses/:id/activate', auth, courses.activate);
  router.post('/courses/:id/deactivate', auth, courses.deactivate);
  router.post('/courses/:id/template', auth, courses.associateTemplate);
  router.post('/courses/:id/validate', auth, courses.validate);
  router.post('/courses/:id/simulate', auth, courses.simulate);
  router.get('/courses/:id/emissions', auth, courses.emissions);
  router.get('/courses/:id/sync-history', auth, courses.syncHistory);

  // Sync
  router.post('/sync/run', auth, sync.run);
  router.get('/sync/runs', auth, sync.listRuns);
  router.get('/sync/runs/:id', auth, sync.getRun);
  router.get('/sync/runs/:id/report', auth, sync.report);
  router.get('/progress', auth, sync.progress);

  // Certifications
  router.post('/certifications/emit', auth, certs.emit);
  router.get('/certifications/history', auth, certs.history);
  router.get('/certifications/:id', auth, certs.status);
  router.post('/certifications/:id/retry', auth, certs.retry);
  router.get('/courses/:courseId/eligible', auth, certs.eligible);

  return router;
}
