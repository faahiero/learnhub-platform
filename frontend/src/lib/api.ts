import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_BROWSER_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('token');
      Cookies.remove('user');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data: { fullName: string; email: string; password: string; role: string }) =>
    api.post('/api/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/api/auth/login', data),
  getProfile: () => api.get('/api/auth/profile'),
  updateProfile: (data: { fullName?: string; bio?: string; avatarUrl?: string }) =>
    api.put('/api/auth/profile', data),
};

// Courses
export const coursesAPI = {
  getAll: (params?: { category?: string; level?: string; search?: string; page?: number; pageSize?: number }) =>
    api.get('/api/courses', { params }),
  getById: (id: string) => api.get(`/api/courses/${id}`),
  create: (data: {
    title: string; description: string; shortDescription?: string;
    category: string; level: string; price: number; thumbnailUrl?: string;
  }) => api.post('/api/courses', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/api/courses/${id}`, data),
  publish: (id: string) => api.post(`/api/courses/${id}/publish`),
  delete: (id: string) => api.delete(`/api/courses/${id}`),
  getMyCourses: () => api.get('/api/courses/my-courses'),
  getCategories: () => api.get('/api/courses/categories'),
  createSection: (courseId: string, data: { title: string; order: number }) =>
    api.post(`/api/courses/${courseId}/sections`, data),
  createLesson: (courseId: string, sectionId: string, data: {
    title: string; content?: string; type: string; videoUrl?: string;
    durationMinutes: number; order: number; isFree: boolean;
  }) => api.post(`/api/courses/${courseId}/sections/${sectionId}/lessons`, data),
};

// Enrollments
export const enrollmentsAPI = {
  enroll: (data: { courseId: string; courseTitle: string }) =>
    api.post('/api/enrollments', data),
  getMyEnrollments: () => api.get('/api/enrollments/my-enrollments'),
  getEnrollment: (courseId: string) => api.get(`/api/enrollments/${courseId}`),
  updateProgress: (enrollmentId: string, data: { lessonId: string; isCompleted: boolean; watchedSeconds: number }) =>
    api.post(`/api/enrollments/${enrollmentId}/progress`, data),
  createReview: (data: { courseId: string; rating: number; comment?: string }) =>
    api.post('/api/enrollments/reviews', data),
  getCourseReviews: (courseId: string) => api.get(`/api/enrollments/reviews/${courseId}`),
};

// Media
export const mediaAPI = {
  upload: (file: File, courseId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    const params = courseId ? `?courseId=${courseId}` : '';
    return api.post(`/api/media/upload${params}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;
