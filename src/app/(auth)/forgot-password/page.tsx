'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { forgotPasswordAction, type ForgotPasswordFormData } from '@/lib/auth';

export default function ForgotPassword() {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    startTransition(async () => {
      const result = await forgotPasswordAction(formData);
      
      if (result.success) {
        setIsSubmitted(true);
      } else {
        setError(result.error || 'Failed to send reset instructions');
      }
    });
  };

  if (isSubmitted) {
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
              We're here to help
            </h1>
            
            <p className="text-slate-600 leading-relaxed mb-6">
              Password reset instructions are on their way. Check your email and follow the secure link to create a new password for your account.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
                <span className="text-slate-700 text-sm">Secure password reset process</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
                <span className="text-slate-700 text-sm">Link expires in 24 hours</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
                <span className="text-slate-700 text-sm">Check spam folder if needed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message Side */}
        <div className="flex-1 flex items-center justify-center p-8 bg-white">
          <div className="w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-medium text-slate-800 mb-2 tracking-tight">Check your email</h2>
            <p className="text-gray-600 mb-6">
              We sent reset instructions to{' '}
              <span className="font-medium text-slate-800">{formData.email}</span>
            </p>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Didn't receive it?{' '}
                <button 
                  onClick={() => setIsSubmitted(false)}
                  className="text-slate-800 hover:text-slate-900 font-medium transition-colors"
                >
                  Try again
                </button>
              </p>
              
              <Link 
                href="/login"
                className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            Forgot your password?
          </h1>
          
          <p className="text-slate-600 leading-relaxed mb-6">
            No worries! Enter your email address and we'll send you secure instructions to reset your password and get back to managing your projects.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
              <span className="text-slate-700 text-sm">Quick and secure reset process</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
              <span className="text-slate-700 text-sm">Email sent within minutes</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
              <span className="text-slate-700 text-sm">Return to your projects quickly</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-medium text-slate-800 mb-2 tracking-tight">Reset password</h2>
            <p className="text-slate-600">Enter your email for reset instructions</p>
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
                required
                value={formData.email}
                onChange={(e) => setFormData({ email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none text-gray-900"
                placeholder="Enter your email"
              />
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
                  Sending...
                </>
              ) : (
                'Send reset link'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              href="/login"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Back to login
            </Link>
          </div>

          <div className="mt-4 text-center">
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