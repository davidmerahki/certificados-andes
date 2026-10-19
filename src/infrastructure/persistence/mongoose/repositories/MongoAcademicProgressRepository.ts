import { AcademicProgress } from '../../../../domain/entities/AcademicProgress';
import { IAcademicProgressRepository } from '../../../../domain/repositories/IAcademicProgressRepository';
import { AcademicProgressModel } from '../models/AcademicProgressModel';
import { ProgressStatus } from '../../../../domain/entities/AcademicProgress';

export class MongoAcademicProgressRepository
  implements IAcademicProgressRepository
{
  async save(progress: AcademicProgress): Promise<AcademicProgress> {
    const props = progress.toProps();
    const doc = await AcademicProgressModel.findByIdAndUpdate(
      props.id,
      {
        _id: props.id,
        studentId: props.studentId,
        courseConfigId: props.courseConfigId,
        learnWorldsCourseId: props.learnWorldsCourseId,
        progressRate: props.progressRate,
        status: props.status,
        completedUnits: props.completedUnits,
        totalUnits: props.totalUnits,
        syncedAt: props.syncedAt,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return this.toDomain(doc!);
  }

  async upsert(progress: AcademicProgress): Promise<AcademicProgress> {
    const props = progress.toProps();
    const doc = await AcademicProgressModel.findOneAndUpdate(
      {
        studentId: props.studentId,
        courseConfigId: props.courseConfigId,
      },
      {
        $set: {
          learnWorldsCourseId: props.learnWorldsCourseId,
          progressRate: props.progressRate,
          status: props.status,
          completedUnits: props.completedUnits,
          totalUnits: props.totalUnits,
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
  ): Promise<AcademicProgress | null> {
    const doc = await AcademicProgressModel.findOne({
      studentId,
      courseConfigId,
    });
    return doc ? this.toDomain(doc) : null;
  }

  async findByCourse(courseConfigId: string): Promise<AcademicProgress[]> {
    const docs = await AcademicProgressModel.find({ courseConfigId });
    return docs.map((d) => this.toDomain(d));
  }

  private toDomain(
    doc: InstanceType<typeof AcademicProgressModel>,
  ): AcademicProgress {
    return AcademicProgress.reconstitute({
      id: String(doc._id),
      studentId: doc.studentId,
      courseConfigId: doc.courseConfigId,
      learnWorldsCourseId: doc.learnWorldsCourseId,
      progressRate: doc.progressRate,
      status: doc.status as ProgressStatus,
      completedUnits: doc.completedUnits,
      totalUnits: doc.totalUnits,
      syncedAt: doc.syncedAt,
    });
  }
}
