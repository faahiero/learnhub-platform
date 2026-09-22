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
            <div className="hidden md:flex ml-10 space-x-3 items-center">
              <Link href="/courses" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Explorar Cursos
              </Link>
              {user?.role === 'Instructor' && (
                <Link
                  href="/instructor"
                  className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                >
                  <GraduationCap className="h-4 w-4" />
                  Painel do Instrutor
                </Link>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/dashboard" className="flex items-center gap-1.5 text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  <LayoutDashboard className="h-4 w-4" />
                  Meus Cursos
                </Link>
                <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-900 leading-tight">{user.fullName}</span>
                    <span className="text-[10px] text-indigo-600 font-medium capitalize">
                      {user.role === 'Instructor' ? 'Instrutor' : 'Aluno'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-1 text-gray-500 hover:text-red-600 px-2 py-1.5 rounded-md text-sm font-medium transition-colors ml-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
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
              Explorar Cursos
            </Link>
            {user ? (
              <>
                <Link href="/dashboard" className="block text-gray-600 hover:text-indigo-600 py-2" onClick={() => setMobileOpen(false)}>
                  Meus Cursos
                </Link>
                {user.role === 'Instructor' && (
                  <Link href="/instructor" className="block text-indigo-600 font-medium py-2" onClick={() => setMobileOpen(false)}>
                    Painel do Instrutor
                  </Link>
                )}
                <button onClick={() => { logout(); setMobileOpen(false); }} className="block text-red-600 py-2 w-full text-left">
                  Sair
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
