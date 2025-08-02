'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

interface Project {
  id: string
  name: string
  lastStandupDate?: string | null
}

interface ProjectSwitcherProps {
  projects: Project[]
  currentProject: Project | null
}

export default function ProjectSwitcher({ projects, currentProject }: ProjectSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleProjectSelect = (projectId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (projectId === 'all') {
      params.delete('project')
    } else {
      params.set('project', projectId)
    }
    
    const newUrl = `/dashboard/standups${params.toString() ? `?${params.toString()}` : ''}`
    router.push(newUrl)
    setIsOpen(false)
  }

  const currentProjectId = searchParams.get('project')
  const displayProject = currentProjectId 
    ? projects.find(p => p.id === currentProjectId) || currentProject
    : { id: 'all', name: 'All Projects' }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors duration-200 shadow-sm"
      >
        <div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
          </svg>
        </div>
        <span className="font-medium text-slate-800">{displayProject?.name}</span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
          <button
            onClick={() => handleProjectSelect('all')}
            className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors flex items-center gap-3 ${
              !currentProjectId ? 'bg-slate-50 text-slate-900' : 'text-gray-700'
            }`}
          >
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <div className="font-medium">All Projects</div>
              <div className="text-xs text-gray-500">View standups from all projects</div>
            </div>
          </button>

          <div className="h-px bg-gray-100 mx-2 my-1"></div>

          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => handleProjectSelect(project.id)}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors flex items-center gap-3 ${
                currentProjectId === project.id ? 'bg-slate-50 text-slate-900' : 'text-gray-700'
              }`}
            >
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-medium">{project.name}</div>
                <div className="text-xs text-gray-500">
                  {project.lastStandupDate 
                    ? `Last standup: ${new Date(project.lastStandupDate).toLocaleDateString()}`
                    : 'No standups yet'
                  }
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}