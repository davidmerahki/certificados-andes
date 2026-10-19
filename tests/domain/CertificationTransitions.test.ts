import { describe, it, expect } from 'vitest';
import { Certification } from '../../src/domain/entities/Certification';
import { canTransition, CertificationStatuses } from '../../src/domain/value-objects/CertificationStatus';

describe('Certification status transitions', () => {
  it('allows eligible → simulated → pending → emitted', () => {
    expect(
      canTransition(CertificationStatuses.ELIGIBLE, CertificationStatuses.SIMULATED),
    ).toBe(true);
    expect(
      canTransition(
        CertificationStatuses.SIMULATED,
        CertificationStatuses.PENDING_EMISSION,
      ),
    ).toBe(true);
    expect(
      canTransition(
        CertificationStatuses.PENDING_EMISSION,
        CertificationStatuses.EMITTED,
      ),
    ).toBe(true);
  });

  it('forbids emitted → anything', () => {
    expect(
      canTransition(CertificationStatuses.EMITTED, CertificationStatuses.FAILED),
    ).toBe(false);
  });

  it('builds stable idempotency key', () => {
    const cert = Certification.createEligible({
      id: 'c1',
      studentId: 's1',
      courseConfigId: 'courseA',
      learnWorldsCourseId: 'lw1',
      certificationCycle: '2026',
      pokTemplateId: 'tpl',
      configVersionAtEmission: 1,
    });
    expect(cert.idempotencyKey).toBe('s1:courseA:2026');
  });
});
