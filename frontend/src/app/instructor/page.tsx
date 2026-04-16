'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { coursesAPI } from '@/lib/api';
import { Course } from '@/lib/types';
import { Plus, BookOpen, Users, Eye, Edit, Trash2, Send } from 'lucide-react';

export default function InstructorDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'Instructor')) {
      router.push('/login');
      return;
    }
    if (user) {
      coursesAPI.getMyCourses()
        .then(res => setCourses(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user, isLoading, router]);

  const handlePublish = async (courseId: string) => {
    try {
      await coursesAPI.publish(courseId);
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, status: 'Published' } : c));
    } catch { /* error */ }
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    try {
      await coursesAPI.delete(courseId);
      setCourses(prev => prev.filter(c => c.id !== courseId));
    } catch { /* error */ }
  };

  if (isLoading) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Instructor Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your courses</p>
        </div>
        <Link href="/instructor/courses/new"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          <Plus className="h-5 w-5" /> New Course
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-3 rounded-lg"><BookOpen className="h-6 w-6 text-indigo-600" /></div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{courses.length}</div>
              <div className="text-sm text-gray-500">Total Courses</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg"><Eye className="h-6 w-6 text-green-600" /></div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{courses.filter(c => c.status === 'Published').length}</div>
              <div className="text-sm text-gray-500">Published</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-lg"><Users className="h-6 w-6 text-purple-600" /></div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{courses.reduce((a, c) => a + c.enrollmentCount, 0)}</div>
              <div className="text-sm text-gray-500">Total Students</div>
            </div>
          </div>
        </div>
      </div>

      {/* Course List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : courses.length > 0 ? (
        <div className="space-y-4">
          {courses.map(course => (
            <div key={course.id} className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{course.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      course.status === 'Published' ? 'bg-green-100 text-green-700' :
                      course.status === 'Draft' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {course.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{course.category} &middot; {course.level} &middot; ${course.price}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>{course.sections?.length || 0} sections</span>
                    <span>{course.sections?.reduce((a, s) => a + (s.lessons?.length || 0), 0) || 0} lessons</span>
                    <span>{course.enrollmentCount} students</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {course.status === 'Draft' && (
                    <button onClick={() => handlePublish(course.id)}
                      className="inline-flex items-center gap-1 text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors">
                      <Send className="h-3.5 w-3.5" /> Publish
                    </button>
                  )}
                  <Link href={`/instructor/courses/${course.id}/edit`}
                    className="inline-flex items-center gap-1 text-sm border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                    <Edit className="h-3.5 w-3.5" /> Edit
                  </Link>
                  <button onClick={() => handleDelete(course.id)}
                    className="inline-flex items-center gap-1 text-sm text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No courses yet</h3>
          <p className="text-gray-500 mb-6">Create your first course to start teaching</p>
          <Link href="/instructor/courses/new"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
            <Plus className="h-5 w-5" /> Create Course
          </Link>
        </div>
      )}
    </div>
  );
}
