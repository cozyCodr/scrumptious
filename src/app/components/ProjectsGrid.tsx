import type { ProjectSummary } from '@/lib/dashboard'
import ProjectCard from './ProjectCard'
import CreateProjectForm from './CreateProjectForm'

interface ProjectsGridProps {
  projects: ProjectSummary[]
}

export default function ProjectsGrid({ projects }: ProjectsGridProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center text-sm py-16">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md mx-auto shadow">
          <p className="text-slate-600 mb-6 font-medium">
            No projects yet. Create your first project to get started.
          </p>
          <CreateProjectForm triggerButton={
            <button className="cursor-pointer bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-sm">
              Create Your First Project
            </button>
          } />
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}