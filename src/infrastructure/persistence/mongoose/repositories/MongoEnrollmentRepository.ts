import { Enrollment } from '../../../../domain/entities/Enrollment';
import { IEnrollmentRepository } from '../../../../domain/repositories/IEnrollmentRepository';
import { EnrollmentModel } from '../models/EnrollmentModel';

export class MongoEnrollmentRepository implements IEnrollmentRepository {
  async save(enrollment: Enrollment): Promise<Enrollment> {
    const props = enrollment.toProps();
    const doc = await EnrollmentModel.findByIdAndUpdate(
      props.id,
      {
        _id: props.id,
        studentId: props.studentId,
        courseConfigId: props.courseConfigId,
        learnWorldsCourseId: props.learnWorldsCourseId,
        enrolledAt: props.enrolledAt,
        syncedAt: props.syncedAt,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return this.toDomain(doc!);
  }

  async upsert(enrollment: Enrollment): Promise<Enrollment> {
    const props = enrollment.toProps();
    const doc = await EnrollmentModel.findOneAndUpdate(
      {
        studentId: props.studentId,
        courseConfigId: props.courseConfigId,
      },
      {
        $set: {
          learnWorldsCourseId: props.learnWorldsCourseId,
          enrolledAt: props.enrolledAt,
          syncedAt: new Date(),
        },
        $setOnInsert: { _id: props.id },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return this.toDomain(doc!);
  }

  async findByStudentAndCourse(
    studentId: string,
    courseConfigId: string,
  ): Promise<Enrollment | null> {
    const doc = await EnrollmentModel.findOne({ studentId, courseConfigId });
    return doc ? this.toDomain(doc) : null;
  }

  async findByCourse(
    courseConfigId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<Enrollment[]> {
    const docs = await EnrollmentModel.find({ courseConfigId })
      .skip(options?.offset ?? 0)
      .limit(options?.limit ?? 10000);
    return docs.map((d) => this.toDomain(d));
  }

  async countByCourse(courseConfigId: string): Promise<number> {
    return EnrollmentModel.countDocuments({ courseConfigId });
  }

  private toDomain(doc: InstanceType<typeof EnrollmentModel>): Enrollment {
    return Enrollment.reconstitute({
      id: String(doc._id),
      studentId: doc.studentId,
      courseConfigId: doc.courseConfigId,
      learnWorldsCourseId: doc.learnWorldsCourseId,
      enrolledAt: doc.enrolledAt,
      syncedAt: doc.syncedAt,
    });
  }
}
