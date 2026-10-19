export interface LwUser {
  id: string;
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  tags?: string[];
}

export interface LwEnrollment {
  productId: string;
  productType: string;
  userId: string;
  enrolled: boolean;
  created?: number;
}

export interface LwProgress {
  courseId: string;
  userId: string;
  progressRate: number;
  status: 'not_started' | 'in_progress' | 'completed';
  completedUnits: number;
  totalUnits: number;
}

export interface LwCourse {
  id: string;
  title: string;
  description?: string;
}

export interface Paginated<T> {
  data: T[];
  page: number;
  totalPages: number;
  totalItems: number;
}

export interface ILearnWorldsClient {
  listUsers(page?: number, itemsPerPage?: number): Promise<Paginated<LwUser>>;
  getUser(userId: string): Promise<LwUser | null>;
  getCourse(courseId: string): Promise<LwCourse | null>;
  listUserEnrollments(userId: string): Promise<LwEnrollment[]>;
  getUserProgress(userId: string): Promise<LwProgress[]>;
  listCourseUsers(
    courseId: string,
    page?: number,
    itemsPerPage?: number,
  ): Promise<Paginated<LwUser>>;
}
