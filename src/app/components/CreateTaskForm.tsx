'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createTaskAction, getOrganizationMembersAction } from '@/lib/task/actions'
import type { CreateTaskFormData } from '@/lib/task/actions'

interface CreateTaskFormProps {
  targetId: string
  triggerButton?: React.ReactNode | null
  autoOpen?: boolean
  onClose?: () => void
}

interface Member {
  id: string
  name: string
  email: string
  role: string
}

export default function CreateTaskForm({ targetId, triggerButton, autoOpen = false, onClose }: CreateTaskFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [formData, setFormData] = useState<CreateTaskFormData>({
    targetId,
    title: '',
    description: '',
    priority: 'MEDIUM',
    assigneeId: ''
  })

  useEffect(() => {
    if (showForm) {
      loadMembers()
    }
  }, [showForm])

  useEffect(() => {
    if (autoOpen) {
      setShowForm(true)
    }
  }, [autoOpen])

  const loadMembers = async () => {
    try {
      const organizationMembers = await getOrganizationMembersAction()
      setMembers(organizationMembers)
    } catch (error) {
      console.error('Failed to load members:', error)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    startTransition(async () => {
      const result = await createTaskAction(formData)
      
      if (result.success) {
        setFormData({ targetId, title: '', description: '', priority: 'MEDIUM', assigneeId: '' })
        setShowForm(false)
        if (onClose) onClose()
        router.refresh()
      } else {
        setError(result.error || 'Failed to create task')
      }
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  const defaultTrigger = (
    <button
      onClick={() => setShowForm(true)}
      className="text-sm text-slate-600 hover:text-slate-800 font-medium transition-colors duration-200"
    >
      + Add Task
    </button>
  )

  const handleFormClose = () => {
    setShowForm(false)
    if (onClose) onClose()
  }

  return (
    <>
      {triggerButton !== null && (
        <>
          {triggerButton ? (
            <div onClick={() => setShowForm(true)}>
              {triggerButton}
            </div>
          ) : (
            defaultTrigger
          )}
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">New Task</h3>
                </div>
                <button
                  onClick={handleFormClose}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task title
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    A specific, actionable item that can be completed
                  </p>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors text-sm"
                    placeholder="e.g., Install Docker on development machine"
                    required
                    disabled={isPending}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    How urgent or important is this task?
                  </p>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors text-sm"
                    disabled={isPending}
                  >
                    <option value="LOW">Low priority</option>
                    <option value="MEDIUM">Medium priority</option>
                    <option value="HIGH">High priority</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign to <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Who will be responsible for completing this task?
                  </p>
                  <select
                    name="assigneeId"
                    value={formData.assigneeId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors text-sm"
                    disabled={isPending}
                  >
                    <option value="">Unassigned</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} - {member.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Additional details, requirements, or acceptance criteria
                  </p>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors text-sm resize-none"
                    rows={3}
                    placeholder="Provide any additional context or requirements"
                    disabled={isPending}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleFormClose}
                  disabled={isPending}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    'Add task'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}