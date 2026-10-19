import { ICourseConfigRepository } from '../../../domain/repositories/ICourseConfigRepository';
import { ILearnWorldsClient } from '../../../domain/ports/ILearnWorldsClient';
import { IPokClient } from '../../../domain/ports/IPokClient';
import { TemplateCompatibilityService } from '../../../domain/services/TemplateCompatibilityService';
import { Student } from '../../../domain/entities/Student';
import { NotFoundError } from '../../../domain/errors/DomainError';

export interface CourseValidationReport {
  courseId: string;
  valid: boolean;
  checks: {
    learnWorldsCourseExists: boolean;
    pokTemplateExists: boolean;
    templateCompatible: boolean;
    hasTemplate: boolean;
    canActivate: boolean;
  };
  messages: string[];
  missingTemplateFields: string[];
}

export class ValidateCourseConfigUseCase {
  constructor(
    private readonly courses: ICourseConfigRepository,
    private readonly learnWorlds: ILearnWorldsClient,
    private readonly pok: IPokClient,
    private readonly compatibility: TemplateCompatibilityService,
  ) {}

  async execute(courseId: string): Promise<CourseValidationReport> {
    const course = await this.courses.findById(courseId);
    if (!course) throw new NotFoundError('CourseConfig', courseId);

    const messages: string[] = [];
    const missingTemplateFields: string[] = [];

    const lwCourse = await this.learnWorlds.getCourse(course.learnWorldsCourseId);
    const learnWorldsCourseExists = Boolean(lwCourse);
    if (!learnWorldsCourseExists) {
      messages.push('LearnWorlds course is not accessible');
    }

    let pokTemplateExists = false;
    let templateCompatible = true;

    if (!course.hasTemplate()) {
      messages.push('No POK template configured');
    } else {
      const template = await this.pok.getTemplate(course.pokTemplateId!);
      pokTemplateExists = Boolean(template);
      if (!pokTemplateExists) {
        messages.push('POK template is not accessible');
      } else if (template) {
        const sampleStudent = Student.create({
          id: 'sample',
          learnWorldsUserId: 'sample',
          email: 'sample@example.com',
          firstName: 'Sample',
          lastName: 'Student',
        });
        const compat = this.compatibility.evaluate(template, sampleStudent, course);
        templateCompatible = compat.compatible;
        missingTemplateFields.push(...compat.missingFields);
        if (!compat.compatible) {
          messages.push(
            `Template incompatible: missing ${compat.missingFields.join(', ')}`,
          );
        }
      }
    }

    const hasTemplate = course.hasTemplate();
    const canActivate =
      learnWorldsCourseExists && hasTemplate && pokTemplateExists && templateCompatible;

    return {
      courseId,
      valid: canActivate,
      checks: {
        learnWorldsCourseExists,
        pokTemplateExists,
        templateCompatible,
        hasTemplate,
        canActivate,
      },
      messages,
      missingTemplateFields,
    };
  }
}
