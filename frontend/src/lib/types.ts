export interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  instructorId: string;
  instructorName: string;
  category: string;
  level: string;
  price: number;
  thumbnailUrl?: string;
  status: string;
  rating: number;
  ratingCount: number;
  enrollmentCount: number;
  createdAt: string;
  sections: Section[];
}

export interface Section {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  content?: string;
  type: string;
  videoUrl?: string;
  durationMinutes: number;
  order: number;
  isFree: boolean;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  status: string;
  progressPercent: number;
  enrolledAt: string;
  completedAt?: string;
  lessonProgresses: LessonProgress[];
}

export interface LessonProgress {
  id: string;
  lessonId: string;
  isCompleted: boolean;
  watchedSeconds: number;
  completedAt?: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  courseId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}
