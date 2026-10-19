import { CourseConfig } from '../../../domain/entities/CourseConfig';
import { Certification } from '../../../domain/entities/Certification';
import { SyncRun } from '../../../domain/entities/SyncRun';
import { AcademicProgress } from '../../../domain/entities/AcademicProgress';

export function serializeCourse(course: CourseConfig) {
  const p = course.toProps();
  return {
    id: p.id,
    learnWorldsCourseId: p.learnWorldsCourseId,
    name: p.name,
    description: p.description,
    status: p.status,
    pokTemplateId: p.pokTemplateId,
    emitterOrganization: p.emitterOrganization,
    completionRequirements: p.completionRequirements,
    eligibilityRules: p.eligibilityRules,
    deliveryConfig: p.deliveryConfig,
    recertificationPolicy: p.recertificationPolicy,
    syncConfig: p.syncConfig,
    activatedAt: p.activatedAt,
    configVersion: p.configVersion,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export function serializeCertification(cert: Certification) {
  const p = cert.toProps();
  return {
    id: p.id,
    studentId: p.studentId,
    courseConfigId: p.courseConfigId,
    learnWorldsCourseId: p.learnWorldsCourseId,
    certificationCycle: p.certificationCycle,
    idempotencyKey: p.idempotencyKey,
    status: p.status,
    pokTemplateId: p.pokTemplateId,
    emitterOrganization: p.emitterOrganization,
    pokCredentialId: p.pokCredentialId,
    configVersionAtEmission: p.configVersionAtEmission,
    simulated: p.simulated,
    failureReason: p.failureReason,
    attemptCount: p.attemptCount,
    emittedAt: p.emittedAt,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export function serializeSyncRun(run: SyncRun) {
  const p = run.toProps();
  return {
    id: p.id,
    mode: p.mode,
    status: p.status,
    simulation: p.simulation,
    startedAt: p.startedAt,
    finishedAt: p.finishedAt,
    courseResults: p.courseResults,
    totalEligible: p.totalEligible,
    totalEmitted: p.totalEmitted,
    totalFailed: p.totalFailed,
    errorSummary: p.errorSummary,
  };
}

export function serializeProgress(progress: AcademicProgress) {
  const p = progress.toProps();
  return {
    id: p.id,
    studentId: p.studentId,
    courseConfigId: p.courseConfigId,
    learnWorldsCourseId: p.learnWorldsCourseId,
    progressRate: p.progressRate,
    status: p.status,
    completedUnits: p.completedUnits,
    totalUnits: p.totalUnits,
    syncedAt: p.syncedAt,
  };
}
