'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginAction, type LoginFormData } from '@/lib/auth';

export default function Login() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    startTransition(async () => {
      try {
        const result = await loginAction(formData);
        
        if (result.success) {
          router.push('/dashboard');
          router.refresh();
        } else {
          setError(result.error || 'Login failed');
        }
      } catch (error) {
        console.error('Login error:', error);
        setError('An unexpected error occurred. Please try again.');
      }
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Product Info Side */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-medium">S</span>
            </div>
            <span className="font-medium text-slate-800 text-xl tracking-tight">Scrumptious</span>
          </div>
          
          <h1 className="text-3xl font-medium text-slate-800 mb-4 tracking-tight">
            Streamline your agile workflow
          </h1>
          
          <p className="text-slate-600 leading-relaxed mb-6">
            Organize projects with clear visions, track targets, and keep your team aligned with daily stand-ups. 
            Everything you need for effective project management in one clean interface.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
              <span className="text-slate-700 text-sm">Hierarchical project organization</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
              <span className="text-slate-700 text-sm">Built-in daily stand-up tracking</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
              <span className="text-slate-700 text-sm">Team collaboration tools</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-medium text-slate-800 mb-2 tracking-tight">Welcome back</h2>
            <p className="text-slate-600">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none text-gray-900"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none text-gray-900"
                placeholder="Enter your password"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-slate-800 focus:ring-gray-400 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <Link 
                href="/forgot-password" 
                className="text-sm text-slate-600 hover:text-slate-800 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Don't have an account?{' '}
              <Link 
                href="/signup" 
                className="text-slate-800 hover:text-slate-900 font-medium transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}