'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { coursesAPI, enrollmentsAPI } from '@/lib/api';
import { Course, Review } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Star, Clock, BookOpen, Users, Play, CheckCircle, AlertCircle } from 'lucide-react';

export default function CourseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [error, setError] = useState('');
  const [enrollError, setEnrollError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const courseRes = await coursesAPI.getById(id as string);
        setCourse(courseRes.data);
      } catch {
        setError('Course not found');
        setLoading(false);
        return;
      }
      try {
        const reviewsRes = await enrollmentsAPI.getCourseReviews(id as string);
        setReviews(reviewsRes.data);
      } catch { /* reviews unavailable */ }
      if (user) {
        try {
          await enrollmentsAPI.getEnrollment(id as string);
          setEnrolled(true);
        } catch { /* not enrolled */ }
      }
      setLoading(false);
    };
    fetchData();
  }, [id, user]);

  const handleEnroll = async () => {
    if (!user) { router.push('/login'); return; }
    setEnrolling(true);
    try {
      const lessonCount = course!.sections?.reduce((acc, s) => acc + (s.lessons?.length || 0), 0) || 0;
      await enrollmentsAPI.enroll({ courseId: course!.id, courseTitle: course!.title, totalLessons: lessonCount });
      setEnrolled(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setEnrollError(e.response?.data?.message || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );

  if (error || !course) return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900">{error || 'Course not found'}</h2>
    </div>
  );

  const totalLessons = course.sections?.reduce((acc, s) => acc + (s.lessons?.length || 0), 0) || 0;
  const totalDuration = course.sections?.reduce(
    (acc, s) => acc + (s.lessons?.reduce((a, l) => a + l.durationMinutes, 0) || 0), 0
  ) || 0;

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-indigo-500 text-white text-xs px-2 py-1 rounded-full">{course.category}</span>
                <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">{course.level}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-gray-300 mb-4 text-lg">{course.shortDescription || course.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  {course.rating > 0 ? course.rating.toFixed(1) : 'New'} ({course.ratingCount} ratings)
                </span>
                <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {course.enrollmentCount} students</span>
                <span>by <strong className="text-white">{course.instructorName}</strong></span>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 text-gray-900 shadow-lg">
              <div className="text-3xl font-bold mb-4">
                {course.price === 0 ? 'Free' : `$${course.price.toFixed(2)}`}
              </div>
              {enrolled ? (
                <div className="w-full bg-green-600 text-white py-3 rounded-lg font-medium text-center flex items-center justify-center gap-2">
                  <CheckCircle className="h-5 w-5" /> Enrolled
                </div>
              ) : (
                <button onClick={handleEnroll} disabled={enrolling}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
                  {enrolling ? 'Enrolling...' : 'Enroll Now'}
                </button>
              )}
              {enrollError && (
                <p className="mt-2 text-sm text-red-600">{enrollError}</p>
              )}
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> {totalLessons} lessons</div>
                <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> {Math.floor(totalDuration / 60)}h {totalDuration % 60}m total</div>
                <div className="flex items-center gap-2"><Star className="h-4 w-4" /> Certificate of completion</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">About this course</h2>
              <p className="text-gray-600 whitespace-pre-line">{course.description}</p>
            </div>

            {/* Curriculum */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Curriculum ({course.sections?.length || 0} sections, {totalLessons} lessons)
              </h2>
              <div className="space-y-3">
                {course.sections?.map((section) => (
                  <div key={section.id} className="border rounded-lg">
                    <div className="bg-gray-50 px-4 py-3 font-medium text-gray-900">
                      {section.title}
                    </div>
                    <div className="divide-y">
                      {section.lessons?.map((lesson) => (
                        <div key={lesson.id} className="px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Play className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-700">{lesson.title}</span>
                            {lesson.isFree && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Free</span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">{lesson.durationMinutes}min</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {(!course.sections || course.sections.length === 0) && (
                  <p className="text-gray-500 text-center py-4">No curriculum added yet</p>
                )}
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Reviews ({reviews.length})</h2>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b pb-4 last:border-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-medium text-sm">
                        {review.userName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{review.userName}</div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
                  </div>
                ))}
                {reviews.length === 0 && <p className="text-gray-500 text-center py-4">No reviews yet</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
