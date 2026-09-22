'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { coursesAPI, enrollmentsAPI } from '@/lib/api';
import Link from 'next/link';
import { Course, Review, Lesson } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Star, Clock, BookOpen, Users, Play, CheckCircle, CheckCircle2, AlertCircle, Lock, Video, FileText, Edit3, GraduationCap } from 'lucide-react';

export default function CourseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [error, setError] = useState('');
  const [enrollError, setEnrollError] = useState('');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [lessonNotice, setLessonNotice] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      setEnrolled(false);
      setEnrollment(null);
      setEnrollError('');
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
          const enrollRes = await enrollmentsAPI.getEnrollment(id as string);
          setEnrollment(enrollRes.data);
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
      const res = await enrollmentsAPI.enroll({ courseId: course!.id, courseTitle: course!.title, totalLessons: Math.max(1, lessonCount) });
      setEnrollment(res.data);
      setEnrolled(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setEnrollError(e.response?.data?.message || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  const isOwner = Boolean(user && course && (user.id === course.instructorId || user.role === 'Admin'));

  const isLessonCompleted = (lessonId: string) => {
    return enrollment?.lessonProgresses?.some((p: any) => p.lessonId === lessonId && p.isCompleted) ?? false;
  };

  const handleToggleComplete = async (lessonId: string) => {
    if (!enrollment) return;
    const currentlyCompleted = isLessonCompleted(lessonId);
    const nextState = !currentlyCompleted;

    // Optimistic update
    setEnrollment((prev: any) => {
      if (!prev) return prev;
      const existingList = prev.lessonProgresses || [];
      const exists = existingList.some((p: any) => p.lessonId === lessonId);
      const updatedList = exists
        ? existingList.map((p: any) => p.lessonId === lessonId ? { ...p, isCompleted: nextState } : p)
        : [...existingList, { id: '', lessonId, isCompleted: nextState, watchedSeconds: 0 }];

      const completedCount = updatedList.filter((p: any) => p.isCompleted).length;
      const total = totalLessons || 1;
      const progressPercent = Math.min(100, Math.round((completedCount / total) * 100));

      return {
        ...prev,
        lessonProgresses: updatedList,
        progressPercent,
      };
    });

    try {
      const res = await enrollmentsAPI.updateProgress(enrollment.id, {
        lessonId,
        isCompleted: nextState,
        watchedSeconds: 0,
      });
      if (res.data) {
        setEnrollment(res.data);
      }
    } catch (err) {
      console.error('Failed to update progress', err);
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
            <div className="bg-white rounded-xl p-6 text-gray-900 shadow-lg border border-gray-100">
              <div className="text-3xl font-bold mb-4">
                {course.price === 0 ? 'Free' : `$${course.price.toFixed(2)}`}
              </div>
              {isOwner ? (
                <div className="space-y-3">
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-center">
                    <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Seu Curso</span>
                    <p className="text-xs text-indigo-900 mt-1">Você é o instrutor deste curso e possui acesso irrestrito a todas as aulas.</p>
                  </div>
                  <Link
                    href={`/instructor/courses/${course.id}/edit`}
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 text-center"
                  >
                    <Edit3 className="h-4 w-4" /> Gerenciar / Editar Conteúdo
                  </Link>
                </div>
              ) : enrolled ? (
                <div className="space-y-3">
                  <div className="w-full bg-green-50 border border-green-200 text-green-700 py-3 rounded-lg font-medium text-center flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" /> Matriculado
                  </div>
                  {enrollment && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Seu Progresso</span>
                        <span className="font-semibold text-indigo-600">{Math.round(enrollment.progressPercent || 0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${enrollment.progressPercent || 0}%` }}
                        />
                      </div>
                    </div>
                  )}
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

            {/* Active Lesson Player */}
            {activeLesson && (
              <div className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl p-5 text-white border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-wide bg-indigo-600 px-2 py-0.5 rounded font-semibold text-white">
                        {activeLesson.type}
                      </span>
                      {activeLesson.isFree && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Preview Grátis</span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold mt-1 text-white">{activeLesson.title}</h3>
                  </div>
                  <button 
                    onClick={() => setActiveLesson(null)} 
                    className="text-gray-400 hover:text-white px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-sm font-medium transition-colors"
                  >
                    ✕ Fechar
                  </button>
                </div>

                {activeLesson.videoUrl ? (
                  <div className="rounded-lg overflow-hidden bg-black shadow-inner">
                    <video
                      key={activeLesson.id}
                      src={activeLesson.videoUrl}
                      controls
                      autoPlay
                      className="w-full max-h-[500px] mx-auto"
                    />
                  </div>
                ) : activeLesson.content ? (
                  <div className="bg-gray-800 p-6 rounded-lg whitespace-pre-line text-gray-200 text-sm leading-relaxed border border-gray-700">
                    {activeLesson.content}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    Nenhum conteúdo multimídia anexado a esta lição ainda.
                  </div>
                )}

                {/* Lesson Action Footer */}
                <div className="mt-4 pt-4 border-t border-gray-800 flex flex-wrap items-center justify-between gap-3">
                  {enrolled && enrollment && (
                    <button
                      onClick={() => handleToggleComplete(activeLesson.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isLessonCompleted(activeLesson.id)
                          ? 'bg-green-600/20 text-green-400 border border-green-500/40 hover:bg-green-600/30'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {isLessonCompleted(activeLesson.id) ? 'Aula Concluída ✓' : 'Marcar como Concluída'}
                    </button>
                  )}
                  {isOwner && (
                    <span className="text-xs text-indigo-300 bg-indigo-900/50 px-2.5 py-1 rounded border border-indigo-700/50">
                      Modo de visualização do instrutor
                    </span>
                  )}
                </div>
              </div>
            )}

            {lessonNotice && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg flex items-center justify-between">
                <span>{lessonNotice}</span>
                <button onClick={() => setLessonNotice('')} className="text-amber-600 font-bold ml-2">✕</button>
              </div>
            )}

            {/* Curriculum */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Curriculum ({course.sections?.length || 0} sections, {totalLessons} lessons)
              </h2>
              <div className="space-y-3">
                {course.sections?.map((section) => (
                  <div key={section.id} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 font-medium text-gray-900">
                      {section.title}
                    </div>
                    <div className="divide-y">
                      {section.lessons?.map((lesson) => {
                        const isAccessible = enrolled || lesson.isFree || isOwner;
                        const completed = isLessonCompleted(lesson.id);
                        return (
                          <div 
                            key={lesson.id} 
                            onClick={() => {
                              if (isAccessible) {
                                setActiveLesson(lesson);
                                setLessonNotice('');
                              } else {
                                setLessonNotice('Esta aula é exclusiva para alunos matriculados. Matricule-se para assistir!');
                              }
                            }}
                            className={`px-4 py-3 flex items-center justify-between transition-colors ${
                              isAccessible ? 'cursor-pointer hover:bg-indigo-50/50' : 'cursor-not-allowed opacity-75 bg-gray-50/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {completed ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                              ) : isAccessible ? (
                                <Play className="h-4 w-4 text-indigo-600 shrink-0" />
                              ) : (
                                <Lock className="h-4 w-4 text-gray-400 shrink-0" />
                              )}
                              <span className={`text-sm font-medium ${completed ? 'text-gray-500 line-through' : isAccessible ? 'text-gray-900' : 'text-gray-500'}`}>
                                {lesson.title}
                              </span>
                              {lesson.videoUrl && (
                                <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                  <Video className="h-3 w-3" /> Vídeo
                                </span>
                              )}
                              {lesson.isFree && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Free Preview</span>
                              )}
                            </div>
                            <span className="text-xs text-gray-400">{lesson.durationMinutes}min</span>
                          </div>
                        );
                      })}
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
