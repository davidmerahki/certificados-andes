import { Student } from '../../../../domain/entities/Student';
import { IStudentRepository } from '../../../../domain/repositories/IStudentRepository';
import { StudentModel } from '../models/StudentModel';

export class MongoStudentRepository implements IStudentRepository {
  async save(student: Student): Promise<Student> {
    const props = student.toProps();
    const doc = await StudentModel.findByIdAndUpdate(
      props.id,
      {
        _id: props.id,
        learnWorldsUserId: props.learnWorldsUserId,
        email: props.email,
        firstName: props.firstName,
        lastName: props.lastName,
        tags: props.tags,
        syncedAt: props.syncedAt,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return this.toDomain(doc!);
  }

  async upsertByLearnWorldsId(student: Student): Promise<Student> {
    const props = student.toProps();
    const doc = await StudentModel.findOneAndUpdate(
      { learnWorldsUserId: props.learnWorldsUserId },
      {
        $set: {
          email: props.email,
          firstName: props.firstName,
          lastName: props.lastName,
          tags: props.tags,
          syncedAt: props.syncedAt,
        },
        $setOnInsert: { _id: props.id },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return this.toDomain(doc!);
  }

  async findById(id: string): Promise<Student | null> {
    const doc = await StudentModel.findById(id);
    return doc ? this.toDomain(doc) : null;
  }

  async findByLearnWorldsUserId(
    learnWorldsUserId: string,
  ): Promise<Student | null> {
    const doc = await StudentModel.findOne({ learnWorldsUserId });
    return doc ? this.toDomain(doc) : null;
  }

  async findByEmail(email: string): Promise<Student | null> {
    const doc = await StudentModel.findOne({
      email: email.toLowerCase().trim(),
    });
    return doc ? this.toDomain(doc) : null;
  }

  async findByIds(ids: string[]): Promise<Student[]> {
    const docs = await StudentModel.find({ _id: { $in: ids } });
    return docs.map((d) => this.toDomain(d));
  }

  async findAll(options?: {
    limit?: number;
    offset?: number;
  }): Promise<Student[]> {
    const docs = await StudentModel.find()
      .skip(options?.offset ?? 0)
      .limit(options?.limit ?? 100);
    return docs.map((d) => this.toDomain(d));
  }

  private toDomain(doc: InstanceType<typeof StudentModel>): Student {
    return Student.reconstitute({
      id: String(doc._id),
      learnWorldsUserId: doc.learnWorldsUserId,
      email: doc.email,
      firstName: doc.firstName,
      lastName: doc.lastName,
      tags: doc.tags,
      syncedAt: doc.syncedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
