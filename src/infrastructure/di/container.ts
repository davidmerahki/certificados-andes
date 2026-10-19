import { AppConfig, loadConfig } from '../config/env';
import { ConsoleLogger } from '../logging/ConsoleLogger';
import { UuidGenerator } from '../config/UuidGenerator';
import { MongoDistributedLock } from '../locks/MongoDistributedLock';
import { LearnWorldsHttpClient } from '../external/learnworlds/LearnWorldsHttpClient';
import { PokHttpClient } from '../external/pok/PokHttpClient';
import { MongoCourseConfigRepository } from '../persistence/mongoose/repositories/MongoCourseConfigRepository';
import { MongoStudentRepository } from '../persistence/mongoose/repositories/MongoStudentRepository';
import { MongoEnrollmentRepository } from '../persistence/mongoose/repositories/MongoEnrollmentRepository';
import { MongoAcademicProgressRepository } from '../persistence/mongoose/repositories/MongoAcademicProgressRepository';
import { MongoCertificationRepository } from '../persistence/mongoose/repositories/MongoCertificationRepository';
import { MongoSyncRunRepository } from '../persistence/mongoose/repositories/MongoSyncRunRepository';
import { EligibilityService } from '../../domain/services/EligibilityService';
import { TemplateCompatibilityService } from '../../domain/services/TemplateCompatibilityService';
import { ILearnWorldsClient } from '../../domain/ports/ILearnWorldsClient';
import { IPokClient } from '../../domain/ports/IPokClient';
import { ILogger } from '../../domain/ports/ILogger';
import { IIdGenerator } from '../../domain/ports/IIdGenerator';
import { IDistributedLock } from '../../domain/ports/IDistributedLock';
import { ICourseConfigRepository } from '../../domain/repositories/ICourseConfigRepository';
import { IStudentRepository } from '../../domain/repositories/IStudentRepository';
import { IEnrollmentRepository } from '../../domain/repositories/IEnrollmentRepository';
import { IAcademicProgressRepository } from '../../domain/repositories/IAcademicProgressRepository';
import { ICertificationRepository } from '../../domain/repositories/ICertificationRepository';
import { ISyncRunRepository } from '../../domain/repositories/ISyncRunRepository';

import { RegisterCourseUseCase } from '../../application/use-cases/courses/RegisterCourseUseCase';
import { UpdateCourseConfigUseCase } from '../../application/use-cases/courses/UpdateCourseConfigUseCase';
import { ActivateCourseUseCase } from '../../application/use-cases/courses/ActivateCourseUseCase';
import { DeactivateCourseUseCase } from '../../application/use-cases/courses/DeactivateCourseUseCase';
import { ListCoursesUseCase } from '../../application/use-cases/courses/ListCoursesUseCase';
import { GetCourseUseCase } from '../../application/use-cases/courses/GetCourseUseCase';
import { AssociatePokTemplateUseCase } from '../../application/use-cases/courses/AssociatePokTemplateUseCase';
import { ValidateCourseConfigUseCase } from '../../application/use-cases/courses/ValidateCourseConfigUseCase';
import { SyncStudentsUseCase } from '../../application/use-cases/sync/SyncStudentsUseCase';
import { SyncEnrollmentsUseCase } from '../../application/use-cases/sync/SyncEnrollmentsUseCase';
import { QueryAcademicProgressUseCase } from '../../application/use-cases/sync/QueryAcademicProgressUseCase';
import { RunSynchronizationUseCase } from '../../application/use-cases/sync/RunSynchronizationUseCase';
import { QuerySyncRunUseCase } from '../../application/use-cases/sync/QuerySyncRunUseCase';
import { IdentifyEligibleStudentsUseCase } from '../../application/use-cases/certification/IdentifyEligibleStudentsUseCase';
import { SimulateEmissionsUseCase } from '../../application/use-cases/certification/SimulateEmissionsUseCase';
import { EmitCredentialUseCase } from '../../application/use-cases/certification/EmitCredentialUseCase';
import { EmitCredentialByEmailUseCase } from '../../application/use-cases/certification/EmitCredentialByEmailUseCase';
import { EnsureStudentFromLearnWorldsUseCase } from '../../application/use-cases/certification/EnsureStudentFromLearnWorldsUseCase';
import { QueryEmissionStatusUseCase } from '../../application/use-cases/certification/QueryEmissionStatusUseCase';
import { RetryFailedEmissionUseCase } from '../../application/use-cases/certification/RetryFailedEmissionUseCase';
import { QueryCertificationHistoryUseCase } from '../../application/use-cases/certification/QueryCertificationHistoryUseCase';
import { GenerateSyncReportUseCase } from '../../application/use-cases/reports/GenerateSyncReportUseCase';

/**
 * Explicit composition root — no global DI container magic.
 * Dependencies are wired once and injected into use cases.
 */
export interface ApplicationContainer {
  config: AppConfig;
  logger: ILogger;
  useCases: {
    registerCourse: RegisterCourseUseCase;
    updateCourseConfig: UpdateCourseConfigUseCase;
    activateCourse: ActivateCourseUseCase;
    deactivateCourse: DeactivateCourseUseCase;
    listCourses: ListCoursesUseCase;
    getCourse: GetCourseUseCase;
    associatePokTemplate: AssociatePokTemplateUseCase;
    validateCourseConfig: ValidateCourseConfigUseCase;
    syncStudents: SyncStudentsUseCase;
    syncEnrollments: SyncEnrollmentsUseCase;
    queryAcademicProgress: QueryAcademicProgressUseCase;
    runSynchronization: RunSynchronizationUseCase;
    querySyncRun: QuerySyncRunUseCase;
    identifyEligible: IdentifyEligibleStudentsUseCase;
    simulateEmissions: SimulateEmissionsUseCase;
    emitCredential: EmitCredentialUseCase;
    emitCredentialByEmail: EmitCredentialByEmailUseCase;
    queryEmissionStatus: QueryEmissionStatusUseCase;
    retryFailedEmission: RetryFailedEmissionUseCase;
    queryCertificationHistory: QueryCertificationHistoryUseCase;
    generateSyncReport: GenerateSyncReportUseCase;
  };
}

export interface ContainerOverrides {
  config?: AppConfig;
  logger?: ILogger;
  learnWorlds?: ILearnWorldsClient;
  pok?: IPokClient;
  ids?: IIdGenerator;
  lock?: IDistributedLock;
  courses?: ICourseConfigRepository;
  students?: IStudentRepository;
  enrollments?: IEnrollmentRepository;
  progress?: IAcademicProgressRepository;
  certifications?: ICertificationRepository;
  syncRuns?: ISyncRunRepository;
}

export function createContainer(overrides: ContainerOverrides = {}): ApplicationContainer {
  const config = overrides.config ?? loadConfig();
  const logger = overrides.logger ?? new ConsoleLogger();
  const ids = overrides.ids ?? new UuidGenerator();
  const lock = overrides.lock ?? new MongoDistributedLock();

  const learnWorlds =
    overrides.learnWorlds ??
    new LearnWorldsHttpClient({
      baseUrl: config.learnWorlds.baseUrl,
      accessToken: config.learnWorlds.accessToken,
      clientId: config.learnWorlds.clientId,
    });

  const pok =
    overrides.pok ??
    new PokHttpClient({
      baseUrl: config.pok.baseUrl,
      apiKey: config.pok.apiKey,
    });

  const courses = overrides.courses ?? new MongoCourseConfigRepository();
  const students = overrides.students ?? new MongoStudentRepository();
  const enrollments = overrides.enrollments ?? new MongoEnrollmentRepository();
  const progress = overrides.progress ?? new MongoAcademicProgressRepository();
  const certifications =
    overrides.certifications ?? new MongoCertificationRepository();
  const syncRuns = overrides.syncRuns ?? new MongoSyncRunRepository();

  const eligibility = new EligibilityService();
  const compatibility = new TemplateCompatibilityService();

  const syncStudents = new SyncStudentsUseCase(
    students,
    learnWorlds,
    ids,
    logger,
  );
  const syncEnrollments = new SyncEnrollmentsUseCase(
    enrollments,
    progress,
    students,
    learnWorlds,
    ids,
    logger,
  );
  const identifyEligible = new IdentifyEligibleStudentsUseCase(
    enrollments,
    progress,
    students,
    certifications,
    eligibility,
  );
  const simulateEmissions = new SimulateEmissionsUseCase(
    identifyEligible,
    certifications,
    ids,
  );
  const emitCredential = new EmitCredentialUseCase(
    certifications,
    students,
    courses,
    pok,
    ids,
    compatibility,
    logger,
  );
  const ensureStudent = new EnsureStudentFromLearnWorldsUseCase(
    students,
    learnWorlds,
    ids,
  );
  const emitCredentialByEmail = new EmitCredentialByEmailUseCase(
    ensureStudent,
    emitCredential,
    courses,
  );
  const retryFailedEmission = new RetryFailedEmissionUseCase(
    certifications,
    emitCredential,
  );
  const runSynchronization = new RunSynchronizationUseCase(
    courses,
    syncRuns,
    lock,
    ids,
    syncStudents,
    syncEnrollments,
    identifyEligible,
    emitCredential,
    simulateEmissions,
    logger,
  );

  return {
    config,
    logger,
    useCases: {
      registerCourse: new RegisterCourseUseCase(courses, ids, learnWorlds),
      updateCourseConfig: new UpdateCourseConfigUseCase(courses),
      activateCourse: new ActivateCourseUseCase(courses),
      deactivateCourse: new DeactivateCourseUseCase(courses),
      listCourses: new ListCoursesUseCase(courses),
      getCourse: new GetCourseUseCase(courses),
      associatePokTemplate: new AssociatePokTemplateUseCase(courses, pok),
      validateCourseConfig: new ValidateCourseConfigUseCase(
        courses,
        learnWorlds,
        pok,
        compatibility,
      ),
      syncStudents,
      syncEnrollments,
      queryAcademicProgress: new QueryAcademicProgressUseCase(progress),
      runSynchronization,
      querySyncRun: new QuerySyncRunUseCase(syncRuns),
      identifyEligible,
      simulateEmissions,
      emitCredential,
      emitCredentialByEmail,
      queryEmissionStatus: new QueryEmissionStatusUseCase(certifications, pok),
      retryFailedEmission,
      queryCertificationHistory: new QueryCertificationHistoryUseCase(
        certifications,
      ),
      generateSyncReport: new GenerateSyncReportUseCase(syncRuns),
    },
  };
}
