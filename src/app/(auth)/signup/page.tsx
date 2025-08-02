'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signupAction, type SignupFormData } from '@/lib/auth';

export default function Signup() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<SignupFormData>({
    firstName: '',
    lastName: '',
    email: '',
    organizationName: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Client-side validation
    if (!formData.agreeToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    startTransition(async () => {
      const result = await signupAction(formData);
      
      if (result.success) {
        router.push('/dashboard');
        router.refresh();
      } else {
        if (result.errors) {
          setFieldErrors(result.errors);
        } else {
          setError(result.error || 'Signup failed');
        }
      }
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear errors when user starts typing
    if (error) setError('');
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: []
      }));
    }
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
            Start your agile journey
          </h1>
          
          <p className="text-slate-600 leading-relaxed mb-6">
            Join teams that deliver better results with structured project management. 
            Create your organization and invite your team to start collaborating effectively.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
              <span className="text-slate-700 text-sm">Set up your organization in minutes</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
              <span className="text-slate-700 text-sm">Invite team members instantly</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
              <span className="text-slate-700 text-sm">Start tracking progress immediately</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-medium text-slate-800 mb-2 tracking-tight">Create account</h2>
            <p className="text-slate-600">Start managing your projects</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none text-gray-900 ${
                    fieldErrors.firstName?.length ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="John"
                />
                {fieldErrors.firstName?.map((error, index) => (
                  <p key={index} className="mt-1 text-sm text-red-600">{error}</p>
                ))}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none text-gray-900 ${
                    fieldErrors.lastName?.length ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Doe"
                />
                {fieldErrors.lastName?.map((error, index) => (
                  <p key={index} className="mt-1 text-sm text-red-600">{error}</p>
                ))}
              </div>
            </div>

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
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none text-gray-900 ${
                  fieldErrors.email?.length ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="john@company.com"
              />
              {fieldErrors.email?.map((error, index) => (
                <p key={index} className="mt-1 text-sm text-red-600">{error}</p>
              ))}
            </div>

            <div>
              <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-1">
                Organization
              </label>
              <input
                id="organizationName"
                name="organizationName"
                type="text"
                required
                value={formData.organizationName}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none text-gray-900 ${
                  fieldErrors.organizationName?.length ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Your Company"
              />
              {fieldErrors.organizationName?.map((error, index) => (
                <p key={index} className="mt-1 text-sm text-red-600">{error}</p>
              ))}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none text-gray-900 ${
                  fieldErrors.password?.length ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Create password"
                minLength={8}
              />
              {fieldErrors.password?.map((error, index) => (
                <p key={index} className="mt-1 text-sm text-red-600">{error}</p>
              ))}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none text-gray-900 ${
                  fieldErrors.confirmPassword?.length ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Confirm password"
                minLength={8}
              />
              {fieldErrors.confirmPassword?.map((error, index) => (
                <p key={index} className="mt-1 text-sm text-red-600">{error}</p>
              ))}
            </div>

            <div className="flex items-start">
              <input
                id="agreeToTerms"
                name="agreeToTerms"
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
                className="h-4 w-4 text-slate-800 focus:ring-gray-400 border-gray-300 rounded mt-0.5"
              />
              <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-700">
                I agree to the{' '}
                <Link href="/terms" className="text-slate-800 hover:text-slate-900 transition-colors">
                  Terms
                </Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-slate-800 hover:text-slate-900 transition-colors">
                  Privacy Policy
                </Link>
              </label>
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
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <Link 
                href="/login" 
                className="text-slate-800 hover:text-slate-900 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}