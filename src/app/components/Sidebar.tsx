'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ProjectSummary } from '@/lib/dashboard'
import CreateProjectForm from './CreateProjectForm'

interface SidebarProps {
  projects: ProjectSummary[]
}

export default function Sidebar({ projects }: SidebarProps) {
  const pathname = usePathname()
  
  const isActive = (path: string) => {
    if (path === '/dashboard/standups') {
      return pathname === '/dashboard/standups' || pathname.startsWith('/dashboard/standup')
    }
    if (path === '/dashboard/settings') {
      return pathname.startsWith('/dashboard/settings')
    }
    if (path.startsWith('/dashboard/project/')) {
      return pathname === path
    }
    return pathname === path
  }

  return (
    <div className="w-60 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 bg-slate-800 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-semibold">S</span>
          </div>
          <span className="font-semibold text-slate-800 text-base tracking-tight">Scrumptious</span>
        </div>
        <CreateProjectForm />
      </div>
      
      <div className="flex-1 p-4">
        <div className="mb-6">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Scrum</div>
          <div className="space-y-0.5">
            <Link href="/dashboard/standups" className={`text-sm flex items-center gap-2.5 font-medium px-2.5 py-1.5 rounded-md transition-all duration-150 ${
              isActive('/dashboard/standups') 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-700 hover:text-slate-800 hover:bg-slate-50'
            }`}>
              <svg className={`w-3.5 h-3.5 fill-current ${isActive('/dashboard/standups') ? 'text-slate-200' : 'text-slate-600'}`} viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Stand-ups
            </Link>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Projects</div>
          <div className="space-y-0.5">
            {projects.map(project => {
              const projectPath = `/dashboard/project/${project.id}`
              return (
                <Link 
                  key={project.id} 
                  href={projectPath} 
                  className={`text-sm flex items-center gap-2.5 font-medium px-2.5 py-1.5 rounded-md transition-all duration-150 ${
                    isActive(projectPath)
                      ? 'bg-slate-800 text-white shadow-sm' 
                      : 'text-slate-700 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <svg className={`w-3.5 h-3.5 fill-current ${isActive(projectPath) ? 'text-slate-200' : 'text-slate-500'}`} viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                  </svg>
                  <span className="truncate">{project.name}</span>
                </Link>
              )
            })}
            {projects.length === 0 && (
              <div className="text-xs text-slate-500 px-2.5 py-1.5">
                No projects yet
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Account</div>
          <div className="space-y-0.5">
            <Link href="/dashboard/settings" className={`text-sm flex items-center gap-2.5 font-medium px-2.5 py-1.5 rounded-md transition-all duration-150 ${
              isActive('/dashboard/settings')
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-800 hover:bg-slate-50'
            }`}>
              <svg className={`w-3.5 h-3.5 fill-current ${isActive('/dashboard/settings') ? 'text-slate-200' : 'text-slate-600'}`} viewBox="0 0 20 20">
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