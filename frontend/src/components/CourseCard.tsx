'use client';

import Link from 'next/link';
import { Course } from '@/lib/types';
import { Star, Users, Clock, BookOpen } from 'lucide-react';

export default function CourseCard({ course }: { course: Course }) {
  const totalLessons = course.sections?.reduce((acc, s) => acc + (s.lessons?.length || 0), 0) || 0;
  const totalDuration = course.sections?.reduce(
    (acc, s) => acc + (s.lessons?.reduce((a, l) => a + l.durationMinutes, 0) || 0), 0
  ) || 0;

  return (
    <Link href={`/courses/${course.id}`} className="group">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <div className="aspect-video bg-gradient-to-br from-indigo-500 to-purple-600 relative">
          {course.thumbnailUrl ? (
            <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="h-16 w-16 text-white/50" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span className="bg-white/90 text-indigo-700 text-xs font-semibold px-2 py-1 rounded-full">
              {course.level}
            </span>
          </div>
          {course.price === 0 && (
            <div className="absolute top-3 right-3">
              <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                FREE
              </span>
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="text-xs text-indigo-600 font-medium mb-1">{course.category}</div>
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
            {course.title}
          </h3>
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
            {course.shortDescription || course.description}
          </p>
          <p className="text-xs text-gray-400 mb-3">by {course.instructorName}</p>

          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
            {totalLessons > 0 && (
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {totalLessons} lessons
              </span>
            )}
            {totalDuration > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {Math.round(totalDuration / 60)}h {totalDuration % 60}m
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-medium text-gray-700">
                {course.rating > 0 ? course.rating.toFixed(1) : 'New'}
              </span>
              <span className="text-xs text-gray-400">
                ({course.ratingCount})
              </span>
            </div>
            <span className="text-lg font-bold text-gray-900">
              {course.price === 0 ? 'Free' : `$${course.price.toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
