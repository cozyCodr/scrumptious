'use client'

import { useState, useRef, useEffect } from 'react'
import CreateTaskForm from './CreateTaskForm'
import ColumnManager from './ColumnManager'
import { KanbanColumn } from '@/lib/kanban/types'

interface TargetActionsDropdownProps {
  targetId: string
  columns: KanbanColumn[]
}

export default function TargetActionsDropdown({ targetId, columns }: TargetActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [showColumnManager, setShowColumnManager] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
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

  const handleCreateTaskClick = () => {
    setIsOpen(false)
    setShowCreateTask(true)
  }

  const handleManageColumnsClick = () => {
    setIsOpen(false)
    setShowColumnManager(true)
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm flex items-center gap-2"
        >
          <span>Actions</span>
          <svg 
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
            <button
              onClick={handleCreateTaskClick}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-slate-50 transition-colors flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="font-medium">Add Task</div>
                <div className="text-xs text-gray-500">Create a new task</div>
              </div>
            </button>

            <div className="h-px bg-gray-100 mx-2 my-1"></div>

            <button
              onClick={handleManageColumnsClick}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-slate-50 transition-colors flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="font-medium">Manage Columns</div>
                <div className="text-xs text-gray-500">Add, edit, or delete columns</div>
              </div>
            </button>

            <div className="h-px bg-gray-100 mx-2 my-1"></div>

            <button
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-slate-50 transition-colors flex items-center gap-3"
              disabled
            >
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-400">Export Tasks</div>
                <div className="text-xs text-gray-400">Coming soon</div>
              </div>
            </button>

            <button
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-slate-50 transition-colors flex items-center gap-3"
              disabled
            >
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-400">Target Settings</div>
                <div className="text-xs text-gray-400">Coming soon</div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateTask && (
        <CreateTaskForm
          targetId={targetId}
          triggerButton={null}
          autoOpen={true}
          onClose={() => setShowCreateTask(false)}
        />
      )}

      {/* Column Manager Modal */}
      {showColumnManager && (
        <ColumnManager
          targetId={targetId}
          columns={columns}
          triggerButton={null}
          autoOpen={true}
          onClose={() => setShowColumnManager(false)}
        />
      )}
    </>
  )
}