'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { enrollmentsAPI } from '@/lib/api';
import { Enrollment } from '@/lib/types';
import { BookOpen, Clock, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) { router.push('/login'); return; }
    if (user) {
      enrollmentsAPI.getMyEnrollments()
        .then(res => setEnrollments(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user, isLoading, router]);

  if (isLoading || (!user && !isLoading)) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Learning</h1>
        <p className="text-gray-600 mt-1">Welcome back, {user?.fullName}!</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border p-6 animate-pulse space-y-3">
              <div className="h-5 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-2 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : enrollments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map(enrollment => (
            <Link key={enrollment.id} href={`/courses/${enrollment.courseId}`}
              className="bg-white rounded-xl border p-6 hover:shadow-lg transition-all hover:-translate-y-1 group">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                  {enrollment.courseTitle}
                </h3>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 shrink-0 ml-2" />
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                <Clock className="h-3 w-3" />
                Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium text-indigo-600">{Math.round(enrollment.progressPercent)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full transition-all"
                    style={{ width: `${enrollment.progressPercent}%` }} />
                </div>
              </div>
              <div className="mt-3">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  enrollment.status === 'Completed' ? 'bg-green-100 text-green-700' :
                  enrollment.status === 'Active' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {enrollment.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No enrollments yet</h3>
          <p className="text-gray-500 mb-6">Start learning by enrolling in a course</p>
          <Link href="/courses" className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
            Browse Courses
          </Link>
        </div>
      )}
    </div>
  );
}
