import Link from 'next/link'
import { getSessionUser } from '@/lib/auth/server-utils'
import { redirect } from 'next/navigation'

export default async function LandingPage() {
  // If user is already logged in, redirect to dashboard
  const user = await getSessionUser()
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-800 rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white text-sm font-medium">S</span>
              </div>
              <span className="font-medium text-slate-800 text-xl tracking-tight">Scrumptious</span>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/login" 
                className="text-slate-600 hover:text-slate-800 font-medium px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Sign In
              </Link>
              <Link 
                href="/signup" 
                className="bg-slate-800 hover:bg-slate-900 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium text-slate-800 mb-8 tracking-tight">
            Project Management
            <br />
            <span className="text-slate-600">Made Simple</span>
          </h1>
          <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto font-medium leading-relaxed">
            Organize your projects with clear visions, manageable targets, and daily stand-ups. 
            Keep your team aligned and productive with Scrumptious.
          </p>
          <div className="flex items-center justify-center gap-6">
            <Link 
              href="/signup" 
              className="bg-slate-800 hover:bg-slate-900 text-white font-medium px-8 py-4 rounded-xl transition-colors duration-200 shadow-lg text-lg"
            >
              Start Your First Project
            </Link>
            <Link 
              href="/login" 
              className="text-slate-600 hover:text-slate-800 font-medium px-8 py-4 rounded-xl border border-slate-300 hover:border-slate-400 transition-all duration-200 text-lg"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-slate-800 mb-4">Clear Project Structure</h3>
            <p className="text-slate-600 font-medium leading-relaxed">
              Organize projects with visions, targets, and tasks. Keep everything structured and easy to track.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-slate-800 mb-4">Daily Stand-ups</h3>
            <p className="text-slate-600 font-medium leading-relaxed">
              Keep your team synchronized with daily check-ins. Flexible questionnaires that adapt to your needs.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-slate-800 mb-4">Progress Tracking</h3>
            <p className="text-slate-600 font-medium leading-relaxed">
              Monitor your team's progress with visual indicators and completion tracking across all projects.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}