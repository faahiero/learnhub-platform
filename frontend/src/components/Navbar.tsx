'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, LogOut, User, LayoutDashboard, GraduationCap, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
              <GraduationCap className="h-8 w-8" />
              LearnHub
            </Link>
            <div className="hidden md:flex ml-10 space-x-4">
              <Link href="/courses" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Explore Courses
              </Link>
              {user?.role === 'Instructor' && (
                <Link href="/instructor" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Instructor Dashboard
                </Link>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/dashboard" className="flex items-center gap-1 text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  <LayoutDashboard className="h-4 w-4" />
                  My Learning
                </Link>
                <div className="flex items-center gap-2 text-gray-700 text-sm">
                  <User className="h-4 w-4" />
                  {user.fullName}
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-1 text-gray-600 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Sign In
                </Link>
                <Link href="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                  Get Started
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="text-gray-600">
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-3 space-y-2">
            <Link href="/courses" className="block text-gray-600 hover:text-indigo-600 py-2" onClick={() => setMobileOpen(false)}>
              Explore Courses
            </Link>
            {user ? (
              <>
                <Link href="/dashboard" className="block text-gray-600 hover:text-indigo-600 py-2" onClick={() => setMobileOpen(false)}>
                  My Learning
                </Link>
                {user.role === 'Instructor' && (
                  <Link href="/instructor" className="block text-gray-600 hover:text-indigo-600 py-2" onClick={() => setMobileOpen(false)}>
                    Instructor Dashboard
                  </Link>
                )}
                <button onClick={() => { logout(); setMobileOpen(false); }} className="block text-red-600 py-2">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block text-gray-600 hover:text-indigo-600 py-2" onClick={() => setMobileOpen(false)}>
                  Sign In
                </Link>
                <Link href="/register" className="block bg-indigo-600 text-white px-4 py-2 rounded-lg text-center" onClick={() => setMobileOpen(false)}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
