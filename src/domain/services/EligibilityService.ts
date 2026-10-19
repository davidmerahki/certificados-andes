import { Student } from '../entities/Student';
import { AcademicProgress } from '../entities/AcademicProgress';
import { CourseConfig } from '../entities/CourseConfig';
import { Certification } from '../entities/Certification';
import { CompletionRequirements } from '../value-objects/CompletionRequirements';
import { EligibilityRules } from '../value-objects/EligibilityRules';

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
}

/**
 * Pure domain service: completion + eligibility + idempotency rules.
 * No infrastructure dependencies.
 */
export class EligibilityService {
  evaluateCompletion(
    progress: AcademicProgress,
    requirements: CompletionRequirements,
  ): EligibilityResult {
    const reasons: string[] = [];

    if (progress.progressRate < requirements.minProgressPercent) {
      reasons.push(
        `Progress ${progress.progressRate}% < required ${requirements.minProgressPercent}%`,
      );
    }

    if (
      requirements.requireCompletedStatus &&
      progress.status !== 'completed'
    ) {
      reasons.push(`Status is '${progress.status}', expected 'completed'`);
    }

    if (
      requirements.minCompletedUnits !== undefined &&
      progress.completedUnits < requirements.minCompletedUnits
    ) {
      reasons.push(
        `Completed units ${progress.completedUnits} < required ${requirements.minCompletedUnits}`,
      );
    }

    return { eligible: reasons.length === 0, reasons };
  }

  evaluateStudentRules(
    student: Student,
    rules: EligibilityRules,
  ): EligibilityResult {
    const reasons: string[] = [];

    if (rules.requireEmail && !student.email?.includes('@')) {
      reasons.push('Valid email is required');
    }

    if (rules.requireFullName && !student.fullName) {
      reasons.push('Full name is required');
    }

    if (rules.excludeTags.length > 0) {
      const hit = student.tags.filter((t) => rules.excludeTags.includes(t));
      if (hit.length > 0) {
        reasons.push(`Student has excluded tags: ${hit.join(', ')}`);
      }
    }

    if (rules.includeOnlyTags.length > 0) {
      const hasAny = rules.includeOnlyTags.some((t) => student.tags.includes(t));
      if (!hasAny) {
        reasons.push(
          `Student missing required tags (one of: ${rules.includeOnlyTags.join(', ')})`,
        );
      }
    }

    return { eligible: reasons.length === 0, reasons };
  }

  /**
   * Full eligibility check for a student against a course configuration.
   * Existing certifications for the same identity block re-emission.
   */
  evaluate(input: {
    student: Student;
    progress: AcademicProgress;
    course: CourseConfig;
    existingCertification?: Certification | null;
  }): EligibilityResult {
    const reasons: string[] = [];

    if (!input.course.isActiveForProcessing()) {
      reasons.push('Course is not active for processing');
    }

    if (!input.course.hasTemplate()) {
      reasons.push('Course has no POK template configured');
    }

    const completion = this.evaluateCompletion(
      input.progress,
      input.course.completionRequirements,
    );
    reasons.push(...completion.reasons);

    const studentRules = this.evaluateStudentRules(
      input.student,
      input.course.eligibilityRules,
    );
    reasons.push(...studentRules.reasons);

    if (input.existingCertification) {
      if (input.existingCertification.isTerminalSuccess()) {
        reasons.push(
          `Certification already emitted for cycle '${input.existingCertification.certificationCycle}'`,
        );
      } else if (
        input.existingCertification.status === 'pending_emission' ||
        input.existingCertification.status === 'retrying'
      ) {
        reasons.push('Certification emission already in progress');
      }
    }

    return { eligible: reasons.length === 0, reasons };
  }
}
