'use client'

import { useState } from 'react'
import TaskBoard from './TaskBoard'
import CreateTaskForm from './CreateTaskForm'
import { KanbanBoard } from '@/lib/kanban/types'

interface TargetViewProps {
  kanbanBoard: KanbanBoard
  currentUserId: string
}

export default function TargetView({ kanbanBoard, currentUserId }: TargetViewProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all')

  // Filter tasks based on the active tab
  const getFilteredBoard = () => {
    if (activeTab === 'mine') {
      // Filter tasks assigned to current user
      const myTasks = kanbanBoard.tasks.filter(task => 
        task.assignee && task.assignee.id === currentUserId
      )
      return {
        ...kanbanBoard,
        tasks: myTasks
      }
    }
    return kanbanBoard
  }

  const filteredBoard = getFilteredBoard()
  const allTasksCount = kanbanBoard.tasks.length
  const myTasksCount = kanbanBoard.tasks.filter(task => 
    task.assignee && task.assignee.id === currentUserId
  ).length

  return (
    <>
      {/* Task Filter Tabs */}
      <div className="bg-white px-8 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              All tasks
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {allTasksCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('mine')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'mine'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              My tasks
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'mine'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {myTasksCount}
              </span>
            </button>
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <button className="bg-slate-100/80 text-slate-700 px-3 py-1.5 rounded-md text-xs font-medium">
                Board
              </button>
              <button className="text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-md transition-all duration-200 hover:bg-slate-50 text-xs font-medium">
                Table
              </button>
              <button className="text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-md transition-all duration-200 hover:bg-slate-50 text-xs font-medium">
                List
              </button>
            </div>
            <div className="h-4 w-px bg-slate-300/60"></div>
            <div className="text-slate-500 font-medium">
              {activeTab === 'all' ? allTasksCount : myTasksCount} tasks
              {activeTab === 'mine' && myTasksCount !== allTasksCount && (
                <span className="text-slate-400 ml-1">of {allTasksCount}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {filteredBoard.tasks.length === 0 ? (
        <div className="flex-1 p-8 bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md mx-auto shadow-lg">
              {activeTab === 'mine' ? (
                <>
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6z" />
                    </svg>
                  </div>
                  <p className="text-slate-600 mb-4 font-medium">
                    No tasks assigned to you yet.
                  </p>
                  <p className="text-slate-500 text-sm">
                    Switch to "All tasks" to see all team tasks, or ask someone to assign tasks to you.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-slate-600 mb-6 font-medium">
                    No tasks yet. Add your first task to get started.
                  </p>
                  <CreateTaskForm 
                    targetId={kanbanBoard.targetId}
                    triggerButton={
                      <button className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-sm">
                        Add Your First Task
                      </button>
                    }
                  />
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <TaskBoard initialBoard={filteredBoard} />
      )}
    </>
  )
}