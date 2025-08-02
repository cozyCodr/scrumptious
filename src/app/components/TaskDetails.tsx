'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getTaskDetailsAction, updateTaskAssignmentAction, getOrganizationMembersAction } from '@/lib/task/actions'

interface TaskDetailsProps {
  taskId: string
  onClose: () => void
}

interface TaskDetails {
  id: string
  title: string
  description: string
  columnId: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?: Date | null,
  completedAt?: Date | null,
  assignee?: {
    id: string
    name: string
    email: string
  } | null
  target: {
    id: string
    title: string
    project: {
      id: string
      name: string
    }
  }
  createdAt: Date
  updatedAt: Date
}

interface Member {
  id: string
  name: string
  email: string
  role: string
}

export default function TaskDetails({ taskId, onClose }: TaskDetailsProps) {
  const router = useRouter()
  const [task, setTask] = useState<TaskDetails | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingAssignment, setIsUpdatingAssignment] = useState(false)
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false)

  useEffect(() => {
    loadTaskDetails()
    loadMembers()
  }, [taskId])

  const loadTaskDetails = async () => {
    setIsLoading(true)
    try {
      const taskDetails = await getTaskDetailsAction(taskId)
      setTask(taskDetails)
    } catch (error) {
      console.error('Failed to load task details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMembers = async () => {
    try {
      const organizationMembers = await getOrganizationMembersAction()
      setMembers(organizationMembers)
    } catch (error) {
      console.error('Failed to load members:', error)
    }
  }

  const handleAssigneeChange = async (assigneeId: string | null) => {
    if (!task) return

    setIsUpdatingAssignment(true)
    try {
      const result = await updateTaskAssignmentAction(taskId, assigneeId)

      if (result.success) {
        // Update the local task state
        setTask(prev => prev ? {
          ...prev,
          assignee: assigneeId ? members.find(m => m.id === assigneeId) ? {
            id: assigneeId,
            name: members.find(m => m.id === assigneeId)!.name,
            email: members.find(m => m.id === assigneeId)!.email
          } : null : null
        } : null)

        setShowAssigneeDropdown(false)
        router.refresh() // Refresh the parent page to update the kanban board
      } else {
        alert(result.error || 'Failed to update assignment')
      }
    } catch (error) {
      console.error('Failed to update assignment:', error)
      alert('An error occurred while updating the assignment')
    } finally {
      setIsUpdatingAssignment(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 text-gray-700'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700'
      case 'HIGH': return 'bg-orange-100 text-orange-700'
      case 'URGENT': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-xl">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading task details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-xl">
          <div className="text-center">
            <p className="text-slate-600 mb-4">Task not found or access denied.</p>
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Task Details</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-6">
          {/* Task Title */}
          <div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">{task.title}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{task.target.project.name}</span>
              <span>→</span>
              <span>{task.target.title}</span>
            </div>
          </div>

          {/* Priority & Status */}
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <span className="text-sm text-gray-600 capitalize">{task.columnId.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-wrap">
                {task.description || 'No description provided'}
              </p>
            </div>
          </div>

          {/* Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assigned to</label>
            <div className="relative">
              {task.assignee ? (
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-xs font-medium text-white">
                      {getUserInitials(task.assignee.name)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{task.assignee.name}</div>
                      <div className="text-sm text-gray-500">{task.assignee.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                    disabled={isUpdatingAssignment}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                  disabled={isUpdatingAssignment}
                  className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                  </svg>
                  Assign to someone
                </button>
              )}

              {/* Assignee Dropdown */}
              {showAssigneeDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  <div className="p-2">
                    {task.assignee && (
                      <button
                        onClick={() => handleAssigneeChange(null)}
                        disabled={isUpdatingAssignment}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Unassign
                      </button>
                    )}
                    {members.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => handleAssigneeChange(member.id)}
                        disabled={isUpdatingAssignment || task.assignee?.id === member.id}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors disabled:opacity-50 ${task.assignee?.id === member.id
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center text-xs font-medium text-white">
                            {getUserInitials(member.name)}
                          </div>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-xs text-gray-500">{member.email}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            {task.dueDate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <div className="text-sm text-gray-600">{new Date(task.dueDate).toLocaleDateString()}</div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
              <div className="text-sm text-gray-600">{new Date(task.createdAt).toLocaleDateString()}</div>
            </div>
          </div>

          {task.completedAt && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Completed</label>
              <div className="text-sm text-gray-600">{new Date(task.completedAt).toLocaleDateString()}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}