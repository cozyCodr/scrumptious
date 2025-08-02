import Link from 'next/link'
import type { ProjectSummary } from '@/lib/dashboard'

interface ProjectCardProps {
  project: ProjectSummary
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/dashboard/project/${project.id}`}>
      <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-gray-300 hover:shadow-lg transition-all duration-300 cursor-pointer group">
        <h3 className="text-lg font-medium text-slate-800 mb-4 tracking-tight group-hover:text-slate-900">
          {project.name}
        </h3>
        <div className="mb-4">
          <span className="text-sm text-slate-500 font-medium">Vision:</span>
          <p className="text-slate-700 mt-2 text-sm font-medium leading-relaxed">
            {project.vision}
          </p>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-4">
          <div className="flex items-center gap-4">
            <span>{project.targetCount} targets</span>
            <span>{project.taskCount} tasks</span>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            project.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
            project.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {project.status.toLowerCase()}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Updated: {project.lastActivity.toLocaleDateString()}</span>
          <div className="text-slate-400 group-hover:text-slate-600 transition-colors duration-200">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  )
}