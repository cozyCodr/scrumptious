import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getProjectDetailsAction } from '@/lib/project'
import CreateTargetForm from '../../../components/CreateTargetForm'
import ProjectActionsDropdown from '../../../components/ProjectActionsDropdown'
import { UserRole } from '../../../../../prisma/generated/client'

export default async function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Get real project data
  const projectData = await getProjectDetailsAction(id)

  if (!projectData) {
    redirect('/dashboard')
  }

  const { project, targets, standups, user } = projectData

  return (
    <>
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Link href="/dashboard" className="hover:text-slate-800 font-medium transition-colors duration-200">
            {user.organization.name}
          </Link>
          <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-slate-800 font-medium">{project.name}</span>
        </div>
      </div>

      {/* Project Header */}
      <div className="bg-white px-8 py-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-medium text-slate-800 mb-3 tracking-tight">{project.name}</h1>
            <div className="mb-4">
              <span className="text-sm text-slate-500 font-medium">Vision:</span>
              <p className="text-slate-700 mt-2 font-medium">{project.vision}</p>
            </div>
            {project.description && (
              <p className="text-slate-600 text-sm leading-relaxed">{project.description}</p>
            )}
          </div>
          <ProjectActionsDropdown projectId={id} userRole={user.role} />
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <button className="text-slate-600 hover:text-slate-800 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-slate-50 font-medium">Board</button>
            <button className="bg-slate-100/80 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium">Targets</button>
            <button className="text-slate-600 hover:text-slate-800 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-slate-50 font-medium">Timeline</button>
          </div>
          <div className="h-4 w-px bg-slate-300/60"></div>
          <button className="text-slate-600 hover:text-slate-800 flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-slate-50 font-medium">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
            </svg>
            Filter
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-8 overflow-auto bg-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-slate-800">
                Targets
              </h2>
              <CreateTargetForm projectId={id} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {targets.map((target) => (
                <Link key={target.id} href={`/dashboard/project/${id}/target/${target.id}`}>
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-gray-300 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-medium text-slate-800 group-hover:text-slate-900 tracking-tight">
                        {target.title}
                      </h3>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full font-medium">
                        {target.taskCount} {target.taskCount === 1 ? 'task' : 'tasks'}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm mb-4 font-medium leading-relaxed">
                      {target.description || 'No description provided'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span>
                        {target.completedTasks} of {target.taskCount} completed
                      </span>
                      <div className="text-slate-400 group-hover:text-slate-600 transition-colors duration-200">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {targets.length === 0 && (
              <div className="text-center py-16">
                <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md mx-auto shadow-lg">
                  <p className="text-slate-600 mb-6 font-medium">
                    No targets yet. Add your first target to get started.
                  </p>
                  <CreateTargetForm
                    projectId={id}
                    triggerButton={
                      <button className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-sm">
                        Add Your First Target
                      </button>
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-lg font-medium text-slate-800 mb-6">
              Recent Stand-ups
            </h2>
            <div className="space-y-4">
              {standups.map((standup) => (
                <div key={standup.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="font-medium text-slate-800 mb-4 text-sm tracking-tight">
                    {new Date(standup.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(standup.responses).map(([person, responses]) => (
                      <div key={person} className="border-l-2 border-slate-200 pl-4">
                        <p className="font-medium text-sm text-slate-700 mb-2">
                          {person}
                        </p>
                        <div className="text-xs text-slate-600 space-y-1">
                          {typeof responses === 'object' ? (
                            Object.entries(responses).map(([key, value]) => (
                              // @ts-ignore
                              <p key={key}><span className="font-medium">{key}:</span> {value}</p>
                            ))
                          ) : (
                            <p>{responses}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {standups.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
                  <p className="text-slate-500 text-sm font-medium">
                    No recent stand-ups. Start your first stand-up to see updates here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}