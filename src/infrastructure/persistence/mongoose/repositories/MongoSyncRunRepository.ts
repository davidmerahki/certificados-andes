import { SyncRun } from '../../../../domain/entities/SyncRun';
import { ISyncRunRepository } from '../../../../domain/repositories/ISyncRunRepository';
import { SyncRunModel } from '../models/SyncRunModel';

export class MongoSyncRunRepository implements ISyncRunRepository {
  async save(run: SyncRun): Promise<SyncRun> {
    const props = run.toProps();
    const doc = await SyncRunModel.findByIdAndUpdate(
      props.id,
      {
        _id: props.id,
        mode: props.mode,
        status: props.status,
        simulation: props.simulation,
        startedAt: props.startedAt,
        finishedAt: props.finishedAt,
        courseResults: props.courseResults.map((r) => ({
          courseConfigId: r.courseConfigId,
          courseName: r.courseName,
          studentsProcessed: r.studentsProcessed,
          eligibleFound: r.eligibleFound,
          emissionsRequested: r.emissionsRequested,
          emissionsSimulated: r.emissionsSimulated,
          errorMessages: r.errors,
          success: r.success,
        })),
        totalEligible: props.totalEligible,
        totalEmitted: props.totalEmitted,
        totalFailed: props.totalFailed,
        errorSummary: props.errorSummary,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return this.toDomain(doc!);
  }

  async findById(id: string): Promise<SyncRun | null> {
    const doc = await SyncRunModel.findById(id);
    return doc ? this.toDomain(doc) : null;
  }

  async findRecent(limit = 20): Promise<SyncRun[]> {
    const docs = await SyncRunModel.find().sort({ startedAt: -1 }).limit(limit);
    return docs.map((d) => this.toDomain(d));
  }

  async findByCourse(courseConfigId: string, limit = 20): Promise<SyncRun[]> {
    const docs = await SyncRunModel.find({
      'courseResults.courseConfigId': courseConfigId,
    })
      .sort({ startedAt: -1 })
      .limit(limit);
    return docs.map((d) => this.toDomain(d));
  }

  async findRunning(): Promise<SyncRun | null> {
    const doc = await SyncRunModel.findOne({ status: 'running' }).sort({
      startedAt: -1,
    });
    return doc ? this.toDomain(doc) : null;
  }

  private toDomain(doc: InstanceType<typeof SyncRunModel>): SyncRun {
    return SyncRun.reconstitute({
      id: String(doc._id),
      mode: doc.mode as SyncRun['mode'],
      status: doc.status as SyncRun['status'],
      simulation: doc.simulation,
      startedAt: doc.startedAt,
      finishedAt: doc.finishedAt,
      courseResults: doc.courseResults.map((r) => ({
        courseConfigId: r.courseConfigId,
        courseName: r.courseName,
        studentsProcessed: r.studentsProcessed,
        eligibleFound: r.eligibleFound,
        emissionsRequested: r.emissionsRequested,
        emissionsSimulated: r.emissionsSimulated,
        errors: r.errorMessages ?? [],
        success: r.success,
      })),
      totalEligible: doc.totalEligible,
      totalEmitted: doc.totalEmitted,
      totalFailed: doc.totalFailed,
      errorSummary: doc.errorSummary,
    });
  }
}
