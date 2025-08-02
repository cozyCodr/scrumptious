import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getProjectDetailsAction } from '@/lib/project'
import QuestionnaireManager from './QuestionnaireManager'
import { UserRole } from '@prisma/client'

export default async function QuestionnairePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id: projectId } = await params
  
  // Get project data to verify access
  const projectData = await getProjectDetailsAction(projectId)
  
  if (!projectData) {
    redirect('/dashboard')
  }

  const { project, user } = projectData

  // Only organization owners can access this page
  if (user.role !== UserRole.OWNER) {
    redirect(`/dashboard/project/${projectId}`)
  }

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
          <Link href={`/dashboard/project/${projectId}`} className="hover:text-slate-800 font-medium transition-colors duration-200">
            {project.name}
          </Link>
          <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-slate-800 font-medium">Configure Questionnaire</span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white px-8 py-6 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-medium text-slate-800 mb-3 tracking-tight">Configure Questionnaire</h1>
            <p className="text-slate-600 font-medium">Customize the standup questions for {project.name}</p>
          </div>
          <Link
            href={`/dashboard/project/${projectId}`}
            className="text-slate-600 hover:text-slate-800 font-medium transition-colors duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Project
          </Link>
        </div>
      </div>

      {/* Questionnaire Manager */}
      <QuestionnaireManager projectId={projectId} />
    </>
  )
}