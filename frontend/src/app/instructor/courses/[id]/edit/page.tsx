'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { coursesAPI, mediaAPI } from '@/lib/api';
import { Course } from '@/lib/types';
import { ArrowLeft, Plus, BookOpen, AlertCircle, Upload, Video, CheckCircle2, Loader2, Play } from 'lucide-react';

export default function EditCoursePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sectionTitle, setSectionTitle] = useState('');
  const [lessonForm, setLessonForm] = useState<{
    sectionId: string;
    title: string;
    type: string;
    durationMinutes: number;
    isFree: boolean;
    content: string;
    videoUrl: string;
  } | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'Instructor') { router.push('/login'); return; }
    fetchCourse();
  }, [id, user]);

  const fetchCourse = async () => {
    try {
      const res = await coursesAPI.getById(id as string);
      setCourse(res.data);
    } catch {
      setError('Course not found');
    } finally {
      setLoading(false);
    }
  };

  const addSection = async () => {
    if (!sectionTitle.trim() || !course) return;
    try {
      await coursesAPI.createSection(course.id, {
        title: sectionTitle,
        order: (course.sections?.length || 0) + 1
      });
      setSectionTitle('');
      fetchCourse();
    } catch { setError('Failed to add section'); }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !course) return;
    setUploadingVideo(true);
    setUploadError('');
    try {
      const res = await mediaAPI.upload(file, course.id);
      setLessonForm(prev => prev ? { ...prev, videoUrl: res.data.url } : null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setUploadError(e.response?.data?.message || 'Failed to upload video to AWS S3');
    } finally {
      setUploadingVideo(false);
    }
  };

  const addLesson = async () => {
    if (!lessonForm || !course) return;
    try {
      const section = course.sections?.find(s => s.id === lessonForm.sectionId);
      await coursesAPI.createLesson(course.id, lessonForm.sectionId, {
        title: lessonForm.title,
        type: lessonForm.type,
        content: lessonForm.content || undefined,
        videoUrl: lessonForm.videoUrl || undefined,
        durationMinutes: lessonForm.durationMinutes,
        order: (section?.lessons?.length || 0) + 1,
        isFree: lessonForm.isFree
      });
      setLessonForm(null);
      fetchCourse();
    } catch { setError('Failed to add lesson'); }
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );

  if (!course) return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
      <h2 className="text-2xl font-bold">{error || 'Course not found'}</h2>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/instructor" className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            course.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>{course.status}</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="h-4 w-4" />{error}
        </div>
      )}

      {/* Add Section */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Section</h2>
        <div className="flex gap-3">
          <input type="text" value={sectionTitle} onChange={e => setSectionTitle(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Section title, e.g., Getting Started" />
          <button onClick={addSection}
            className="inline-flex items-center gap-1 bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {course.sections?.map((section, si) => (
          <div key={section.id} className="bg-white rounded-xl border overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Section {si + 1}: {section.title}</h3>
              <button onClick={() => {
                setLessonForm({ sectionId: section.id, title: '', type: 'Video', durationMinutes: 10, isFree: false, content: '', videoUrl: '' });
                setUploadError('');
              }}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Lesson
              </button>
            </div>
            <div className="divide-y">
              {section.lessons?.map((lesson, li) => (
                <div key={lesson.id} className="px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-6">{li + 1}.</span>
                    <span className="text-sm font-medium text-gray-800">{lesson.title}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{lesson.type}</span>
                    {lesson.isFree && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Free</span>}
                    {lesson.videoUrl && (
                      <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <Video className="h-3 w-3" /> Video Attached
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{lesson.durationMinutes}min</span>
                    {lesson.videoUrl && (
                      <button
                        onClick={() => setPreviewVideoUrl(lesson.videoUrl || null)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100"
                      >
                        <Play className="h-3 w-3" /> Preview
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {(!section.lessons || section.lessons.length === 0) && (
                <div className="px-6 py-4 text-sm text-gray-400 text-center">No lessons yet</div>
              )}
            </div>

            {/* Add Lesson Form */}
            {lessonForm?.sectionId === section.id && (
              <div className="px-6 py-4 bg-indigo-50 border-t space-y-4">
                <input type="text" value={lessonForm.title}
                  onChange={e => setLessonForm({...lessonForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Lesson title, e.g. Introduction to Cloud" />
                <div className="grid grid-cols-3 gap-3">
                  <select value={lessonForm.type} onChange={e => setLessonForm({...lessonForm, type: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option>Video</option>
                    <option>Article</option>
                    <option>Quiz</option>
                  </select>
                  <input type="number" value={lessonForm.durationMinutes}
                    onChange={e => setLessonForm({...lessonForm, durationMinutes: parseInt(e.target.value) || 0})}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Duration (min)" min={1} />
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={lessonForm.isFree}
                      onChange={e => setLessonForm({...lessonForm, isFree: e.target.checked})}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    Free preview
                  </label>
                </div>

                {lessonForm.type === 'Video' && (
                  <div className="p-3 bg-white rounded-lg border border-indigo-100 space-y-3">
                    <label className="block text-xs font-semibold text-gray-700">Video Upload (AWS S3)</label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <label className={`cursor-pointer inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                        uploadingVideo 
                          ? 'bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed' 
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent'
                      }`}>
                        {uploadingVideo ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading to AWS S3...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            Upload Video File (MP4, WebM)
                          </>
                        )}
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime"
                          disabled={uploadingVideo}
                          onChange={handleVideoUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-xs text-gray-400 text-center">ou cole o link do vídeo</span>
                      <input
                        type="url"
                        value={lessonForm.videoUrl}
                        onChange={e => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                        placeholder="http://localhost:4566/learnhub-media/... ou URL externa"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    {uploadError && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {uploadError}
                      </p>
                    )}

                    {lessonForm.videoUrl && (
                      <div className="p-2.5 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-green-800 flex items-center gap-1.5 font-medium">
                            <CheckCircle2 className="h-4 w-4 text-green-600" /> Vídeo carregado com sucesso
                          </span>
                          <button
                            type="button"
                            onClick={() => setLessonForm({ ...lessonForm, videoUrl: '' })}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Remover vídeo
                          </button>
                        </div>
                        <video
                          src={lessonForm.videoUrl}
                          controls
                          className="w-full max-h-48 rounded bg-black"
                        />
                      </div>
                    )}
                  </div>
                )}

                {lessonForm.type === 'Article' && (
                  <textarea
                    rows={4}
                    value={lessonForm.content}
                    onChange={e => setLessonForm({ ...lessonForm, content: e.target.value })}
                    placeholder="Escreva o conteúdo textual da lição..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                )}

                <div className="flex gap-2">
                  <button onClick={addLesson} disabled={uploadingVideo}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                    Add Lesson
                  </button>
                  <button onClick={() => setLessonForm(null)} disabled={uploadingVideo}
                    className="border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {(!course.sections || course.sections.length === 0) && (
          <div className="text-center py-12 bg-white rounded-xl border">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Add sections and lessons to build your curriculum</p>
          </div>
        )}
      </div>

      {/* Video Preview Modal */}
      {previewVideoUrl && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-3xl w-full p-4 overflow-hidden shadow-2xl border border-gray-800">
            <div className="flex justify-between items-center mb-3 text-white">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Video className="h-4 w-4 text-indigo-400" /> Pré-visualização do Vídeo
              </h3>
              <button
                onClick={() => setPreviewVideoUrl(null)}
                className="text-gray-400 hover:text-white px-2 py-1 rounded text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <video src={previewVideoUrl} controls autoPlay className="w-full rounded-lg bg-black max-h-[65vh]" />
          </div>
        </div>
      )}
    </div>
  );
}
