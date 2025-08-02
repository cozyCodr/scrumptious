import { logoutAction } from '@/lib/auth'
import type { UserContext } from '@/lib/dashboard'
import CreateProjectForm from './CreateProjectForm'

interface NavHeaderProps {
  user: UserContext
}

export default function NavHeader({ user }: NavHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="text-slate-800 font-medium">{user.organization.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-sm text-slate-600 hover:text-slate-800 flex items-center gap-2 font-medium px-3 py-2 rounded-lg transition-all duration-200 hover:bg-slate-50">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            Search
          </button>
          <form action={logoutAction}>
            <button className="text-sm text-slate-600 hover:text-slate-800 flex items-center gap-2 font-medium px-3 py-2 rounded-lg transition-all duration-200 hover:bg-slate-50">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
              Sign Out
            </button>
          </form>
          <CreateProjectForm triggerButton={
            <button className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm">
              + Add New
            </button>
          } />
        </div>
      </div>
    </div>
  )
}