import {
  ILearnWorldsClient,
  LwUser,
  LwEnrollment,
  LwProgress,
  LwCourse,
  Paginated,
} from '../../../domain/ports/ILearnWorldsClient';

export interface LearnWorldsConfig {
  baseUrl: string;
  accessToken: string;
  clientId?: string;
}

/**
 * HTTP adapter for LearnWorlds Admin API v2.
 * Domain/application never import this class — only the composition root does.
 */
export class LearnWorldsHttpClient implements ILearnWorldsClient {
  constructor(private readonly config: LearnWorldsConfig) {}

  async listUsers(
    page = 1,
    itemsPerPage = 50,
  ): Promise<Paginated<LwUser>> {
    const json = await this.get<{
      data: Array<Record<string, unknown>>;
      meta?: {
        page?: number;
        total_pages?: number;
        total_items?: number;
      };
    }>(`/users?page=${page}&itemsPerPage=${itemsPerPage}`);

    return {
      data: (json.data ?? []).map((u) => this.mapUser(u)),
      page: json.meta?.page ?? page,
      totalPages: json.meta?.total_pages ?? 1,
      totalItems: json.meta?.total_items ?? (json.data?.length ?? 0),
    };
  }

  async getUser(userId: string): Promise<LwUser | null> {
    try {
      const json = await this.get<Record<string, unknown>>(`/users/${userId}`);
      return this.mapUser(json);
    } catch (e: unknown) {
      if (this.isNotFound(e)) return null;
      throw e;
    }
  }

  async getCourse(courseId: string): Promise<LwCourse | null> {
    try {
      const json = await this.get<Record<string, unknown>>(`/courses/${courseId}`);
      return {
        id: String(json.id ?? courseId),
        title: String(json.title ?? json.name ?? ''),
        description: json.description ? String(json.description) : undefined,
      };
    } catch (e: unknown) {
      if (this.isNotFound(e)) return null;
      throw e;
    }
  }

  async listUserEnrollments(userId: string): Promise<LwEnrollment[]> {
    const json = await this.get<{
      data?: Array<Record<string, unknown>>;
    }>(`/users/${userId}/enrollments`);
    return (json.data ?? []).map((e) => ({
      productId: String(e.productId ?? e.product_id ?? ''),
      productType: String(e.productType ?? e.product_type ?? 'course'),
      userId: String(e.user_id ?? userId),
      enrolled: Boolean(e.enrolled ?? true),
      created: e.created ? Number(e.created) : undefined,
    }));
  }

  async getUserProgress(userId: string): Promise<LwProgress[]> {
    const json = await this.get<{
      data?: Array<Record<string, unknown>>;
    }>(`/users/${userId}/progress`);
    return (json.data ?? []).map((p) => ({
      courseId: String(p.course_id ?? p.courseId ?? ''),
      userId: String(p.user_id ?? userId),
      progressRate: Number(p.progress_rate ?? p.progressRate ?? 0),
      status: (p.status as LwProgress['status']) ?? 'not_started',
      completedUnits: Number(p.completed_units ?? p.completedUnits ?? 0),
      totalUnits: Number(p.total_units ?? p.totalUnits ?? 0),
    }));
  }

  async listCourseUsers(
    courseId: string,
    page = 1,
    itemsPerPage = 50,
  ): Promise<Paginated<LwUser>> {
    const json = await this.get<{
      data: Array<Record<string, unknown>>;
      meta?: {
        page?: number;
        total_pages?: number;
        total_items?: number;
      };
    }>(`/courses/${courseId}/users?page=${page}&itemsPerPage=${itemsPerPage}`);

    return {
      data: (json.data ?? []).map((u) => this.mapUser(u)),
      page: json.meta?.page ?? page,
      totalPages: json.meta?.total_pages ?? 1,
      totalItems: json.meta?.total_items ?? (json.data?.length ?? 0),
    };
  }

  private mapUser(u: Record<string, unknown>): LwUser {
    return {
      id: String(u.id ?? ''),
      email: String(u.email ?? ''),
      username: u.username ? String(u.username) : undefined,
      firstName: String(u.first_name ?? u.firstName ?? ''),
      lastName: String(u.last_name ?? u.lastName ?? ''),
      tags: Array.isArray(u.tags) ? u.tags.map(String) : [],
    };
  }

  private async get<T>(path: string): Promise<T> {
    const url = `${this.config.baseUrl.replace(/\/$/, '')}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.config.accessToken}`,
      'Content-Type': 'application/json',
    };
    if (this.config.clientId) {
      headers['Lw-Client'] = this.config.clientId;
    }

    const res = await fetch(url, { headers });
    if (!res.ok) {
      const body = await res.text();
      const err = new Error(`LearnWorlds ${res.status}: ${body}`) as Error & {
        status?: number;
      };
      err.status = res.status;
      throw err;
    }
    return (await res.json()) as T;
  }

  private isNotFound(e: unknown): boolean {
    return (
      typeof e === 'object' &&
      e !== null &&
      'status' in e &&
      (e as { status: number }).status === 404
    );
  }
}
