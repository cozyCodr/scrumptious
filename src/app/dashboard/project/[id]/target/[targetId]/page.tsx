import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTargetDetailsAction } from '@/lib/task/actions'
import { getKanbanBoardAction } from '@/lib/kanban/actions'
import TargetView from '../../../../../components/TargetView'
import TargetActionsDropdown from '../../../../../components/TargetActionsDropdown'

export default async function TargetDetail({
  params
}: {

  params: Promise<{ id: string; targetId: string }>
}) {
  const { id: projectId, targetId } = await params

  // Get real target data
  const targetData = await getTargetDetailsAction(targetId)

  if (!targetData) {
    redirect('/dashboard')
  }

  const { target, project, user } = targetData

  // Get kanban board data
  const kanbanResult = await getKanbanBoardAction(targetId)

  if (!kanbanResult.success || !kanbanResult.data) {
    redirect('/dashboard')
  }

  const kanbanBoard = kanbanResult.data

  return (
    <>
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Link href="/dashboard" className="hover:text-slate-800 font-medium transition-colors duration-200">
            {user.name}
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
          <span className="text-slate-800 font-medium">{target.title}</span>
        </div>
      </div>

      {/* Target Header */}
      <div className="bg-white px-8 py-4 pb-2">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-medium text-slate-800 mb-2 tracking-tight">{target.title}</h1>
            <p className="text-slate-600">{target.description}</p>
          </div>
          <TargetActionsDropdown
            targetId={targetId}
            columns={kanbanBoard.columns}
          />
        </div>
      </div>

      {/* Target View with Tabs */}
      <TargetView kanbanBoard={kanbanBoard} currentUserId={user.id} />
    </>
  )
}