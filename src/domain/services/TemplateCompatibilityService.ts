import { Student } from '../entities/Student';
import { CourseConfig } from '../entities/CourseConfig';

export interface PokTemplateField {
  id: string;
  label: string;
  required: boolean;
}

export interface PokTemplateDetails {
  id: string;
  name: string;
  fields: PokTemplateField[];
}

export interface CompatibilityResult {
  compatible: boolean;
  missingFields: string[];
  availableMappings: Record<string, string>;
}

/**
 * Validates that student/course data can populate a POK template's dynamic fields.
 */
export class TemplateCompatibilityService {
  evaluate(
    template: PokTemplateDetails,
    student: Student,
    course: CourseConfig,
  ): CompatibilityResult {
    const dataPool: Record<string, string> = {
      email: student.email,
      firstName: student.firstName,
      lastName: student.lastName,
      fullName: student.fullName,
      courseName: course.name,
      learnWorldsCourseId: course.learnWorldsCourseId,
    };

    const availableMappings: Record<string, string> = {};
    const missingFields: string[] = [];

    for (const field of template.fields) {
      const key = this.resolveFieldKey(field);
      const value = dataPool[key];
      if (value) {
        availableMappings[field.id] = value;
      } else if (field.required) {
        missingFields.push(field.label || field.id);
      }
    }

    return {
      compatible: missingFields.length === 0,
      missingFields,
      availableMappings,
    };
  }

  private resolveFieldKey(field: PokTemplateField): string {
    const label = (field.label || field.id).toLowerCase().replace(/\s+/g, '');
    if (label.includes('email')) return 'email';
    if (label.includes('firstname') || label.includes('nombre')) return 'firstName';
    if (label.includes('lastname') || label.includes('apellido')) return 'lastName';
    if (label.includes('fullname') || label.includes('nombrecompleto')) {
      return 'fullName';
    }
    if (label.includes('course') || label.includes('curso')) return 'courseName';
    return label;
  }
}
