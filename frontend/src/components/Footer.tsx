'use client';

import { GraduationCap } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 text-white font-bold text-xl mb-4">
              <GraduationCap className="h-8 w-8 text-indigo-400" />
              LearnHub
            </div>
            <p className="text-gray-400 text-sm max-w-md">
              A modern learning platform built with microservices architecture.
              Powered by .NET, Next.js, Docker, and LocalStack.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/courses" className="hover:text-white transition-colors">Browse Courses</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Become an Instructor</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">My Learning</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Technology</h3>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-400">.NET 8 Microservices</li>
              <li className="text-gray-400">Next.js + React</li>
              <li className="text-gray-400">Docker + LocalStack</li>
              <li className="text-gray-400">PostgreSQL + RabbitMQ</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-gray-500 text-center">
          &copy; {new Date().getFullYear()} LearnHub. Built with microservices architecture.
        </div>
      </div>
    </footer>
  );
}
