import Link from 'next/link'
import type { ProjectSummary } from '@/lib/dashboard'
import CreateProjectForm from './CreateProjectForm'

interface SidebarProps {
  projects: ProjectSummary[]
}

export default function Sidebar({ projects }: SidebarProps) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-slate-800 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white text-sm font-medium">S</span>
          </div>
          <span className="font-medium text-slate-800 text-lg tracking-tight">Scrumptious</span>
        </div>
        <CreateProjectForm />
      </div>
      
      <div className="flex-1 p-6">
        <div className="mb-8">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Scrum</div>
          <div className="space-y-1">
            <Link href="/dashboard/standups" className="text-sm text-slate-700 hover:text-slate-800 flex items-center gap-3 font-medium px-3 py-2 rounded-lg transition-all duration-200 hover:bg-slate-50 hover:shadow-sm">
              <svg className="w-4 h-4 fill-current text-slate-600" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Daily Stand-ups
            </Link>
          </div>
        </div>
        
        <div className="mb-8">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Projects</div>
          <div className="space-y-1">
            {projects.map(project => (
              <Link 
                key={project.id} 
                href={`/dashboard/project/${project.id}`} 
                className="text-sm text-slate-700 hover:text-slate-800 flex items-center gap-3 font-medium px-3 py-2 rounded-lg transition-all duration-200 hover:bg-slate-50 hover:shadow-sm"
              >
                <svg className="w-4 h-4 fill-current text-slate-500" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                </svg>
                {project.name}
              </Link>
            ))}
            {projects.length === 0 && (
              <div className="text-sm text-slate-500 px-3 py-2">
                No projects yet
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Account</div>
          <div className="space-y-1">
            <Link href="/dashboard/settings" className="text-sm text-slate-700 hover:text-slate-800 flex items-center gap-3 font-medium px-3 py-2 rounded-lg transition-all duration-200 hover:bg-slate-50 hover:shadow-sm">
              <svg className="w-4 h-4 fill-current text-slate-600" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}