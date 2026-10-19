import {
  CertificationStatus,
  CertificationStatuses,
  assertTransition,
} from '../value-objects/CertificationStatus';
import {
  CertificationIdentity,
  buildIdempotencyKey,
} from '../value-objects/CertificationIdentity';
import { ConflictError } from '../errors/DomainError';

export interface CertificationProps {
  id: string;
  studentId: string;
  courseConfigId: string;
  learnWorldsCourseId: string;
  certificationCycle: string;
  idempotencyKey: string;
  status: CertificationStatus;
  pokTemplateId: string;
  emitterOrganization?: string;
  pokCredentialId?: string;
  configVersionAtEmission: number;
  simulated: boolean;
  failureReason?: string;
  attemptCount: number;
  emittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Certification {
  private constructor(private props: CertificationProps) {}

  static createEligible(input: {
    id: string;
    studentId: string;
    courseConfigId: string;
    learnWorldsCourseId: string;
    certificationCycle: string;
    pokTemplateId: string;
    emitterOrganization?: string;
    configVersionAtEmission: number;
  }): Certification {
    const identity: CertificationIdentity = {
      studentId: input.studentId,
      courseConfigId: input.courseConfigId,
      certificationCycle: input.certificationCycle,
    };
    const now = new Date();
    return new Certification({
      id: input.id,
      studentId: input.studentId,
      courseConfigId: input.courseConfigId,
      learnWorldsCourseId: input.learnWorldsCourseId,
      certificationCycle: input.certificationCycle,
      idempotencyKey: buildIdempotencyKey(identity),
      status: CertificationStatuses.ELIGIBLE,
      pokTemplateId: input.pokTemplateId,
      emitterOrganization: input.emitterOrganization,
      configVersionAtEmission: input.configVersionAtEmission,
      simulated: false,
      attemptCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: CertificationProps): Certification {
    return new Certification(props);
  }

  get id(): string {
    return this.props.id;
  }

  get studentId(): string {
    return this.props.studentId;
  }

  get courseConfigId(): string {
    return this.props.courseConfigId;
  }

  get learnWorldsCourseId(): string {
    return this.props.learnWorldsCourseId;
  }

  get certificationCycle(): string {
    return this.props.certificationCycle;
  }

  get idempotencyKey(): string {
    return this.props.idempotencyKey;
  }

  get status(): CertificationStatus {
    return this.props.status;
  }

  get pokTemplateId(): string {
    return this.props.pokTemplateId;
  }

  get emitterOrganization(): string | undefined {
    return this.props.emitterOrganization;
  }

  get pokCredentialId(): string | undefined {
    return this.props.pokCredentialId;
  }

  get configVersionAtEmission(): number {
    return this.props.configVersionAtEmission;
  }

  get simulated(): boolean {
    return this.props.simulated;
  }

  get failureReason(): string | undefined {
    return this.props.failureReason;
  }

  get attemptCount(): number {
    return this.props.attemptCount;
  }

  get emittedAt(): Date | undefined {
    return this.props.emittedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  markSimulated(): void {
    assertTransition(this.props.status, CertificationStatuses.SIMULATED);
    this.props.status = CertificationStatuses.SIMULATED;
    this.props.simulated = true;
    this.touch();
  }

  markPendingEmission(): void {
    assertTransition(this.props.status, CertificationStatuses.PENDING_EMISSION);
    this.props.status = CertificationStatuses.PENDING_EMISSION;
    this.props.attemptCount += 1;
    this.touch();
  }

  markEmitted(pokCredentialId: string): void {
    assertTransition(this.props.status, CertificationStatuses.EMITTED);
    this.props.status = CertificationStatuses.EMITTED;
    this.props.pokCredentialId = pokCredentialId;
    this.props.emittedAt = new Date();
    this.props.failureReason = undefined;
    this.touch();
  }

  markFailed(reason: string): void {
    assertTransition(this.props.status, CertificationStatuses.FAILED);
    this.props.status = CertificationStatuses.FAILED;
    this.props.failureReason = reason;
    this.touch();
  }

  markRetrying(): void {
    if (this.props.status === CertificationStatuses.EMITTED) {
      throw new ConflictError('Cannot retry an already emitted certification');
    }
    assertTransition(this.props.status, CertificationStatuses.RETRYING);
    this.props.status = CertificationStatuses.RETRYING;
    this.touch();
  }

  cancel(): void {
    assertTransition(this.props.status, CertificationStatuses.CANCELLED);
    this.props.status = CertificationStatuses.CANCELLED;
    this.touch();
  }

  isTerminalSuccess(): boolean {
    return this.props.status === CertificationStatuses.EMITTED;
  }

  canEmit(): boolean {
    return (
      this.props.status === CertificationStatuses.ELIGIBLE ||
      this.props.status === CertificationStatuses.SIMULATED ||
      this.props.status === CertificationStatuses.RETRYING
    );
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toProps(): CertificationProps {
    return { ...this.props };
  }
}
