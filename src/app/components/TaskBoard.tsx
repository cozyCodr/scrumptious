'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { updateTaskColumnAction } from '@/lib/kanban/actions'
import { KanbanColumn, KanbanTask, KanbanBoard } from '@/lib/kanban/types'
import TaskDetails from './TaskDetails'
import CreateTaskForm from './CreateTaskForm'

interface TaskBoardProps {
  initialBoard: KanbanBoard
}

export default function TaskBoard({ initialBoard }: TaskBoardProps) {
  const router = useRouter()
  const [board, setBoard] = useState<KanbanBoard>(initialBoard)
  const [draggedTask, setDraggedTask] = useState<KanbanTask | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false)
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 })
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showCreateTaskForm, setShowCreateTaskForm] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  const getTasksByColumn = (columnId: string) => {
    return board.tasks.filter(task => task.columnId === columnId)
  }

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, task: KanbanTask) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', '')
    
    // Create a transparent drag image
    const img = new Image()
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    e.dataTransfer.setDragImage(img, 0, 0)
  }

  const handleDragOver = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(columnKey)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverColumn(null)
    }
  }

  const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault()
    setDragOverColumn(null)
    
    if (draggedTask && draggedTask.columnId !== targetColumnId) {
      // Optimistically update the UI
      setBoard(prev => ({
        ...prev,
        tasks: prev.tasks.map(task => 
          task.id === draggedTask.id ? { ...task, columnId: targetColumnId } : task
        )
      }))

      // Update on server
      const result = await updateTaskColumnAction({
        taskId: draggedTask.id,
        newColumnId: targetColumnId
      })
      
      if (!result.success) {
        // Revert on error
        setBoard(prev => ({
          ...prev,
          tasks: prev.tasks.map(task => 
            task.id === draggedTask.id ? draggedTask : task
          )
        }))
        console.error('Failed to update task column:', result.error)
      } else {
        // Refresh the page to get updated data
        router.refresh()
      }
    }
    setDraggedTask(null)
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
    setDragOverColumn(null)
  }

  // Canvas dragging functionality
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDraggingCanvas(true)
      setLastMousePos({ x: e.clientX, y: e.clientY })
      e.preventDefault()
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDraggingCanvas && canvasRef.current) {
      const deltaX = e.clientX - lastMousePos.x
      const deltaY = e.clientY - lastMousePos.y
      
      canvasRef.current.scrollLeft -= deltaX
      canvasRef.current.scrollTop -= deltaY
      
      setLastMousePos({ x: e.clientX, y: e.clientY })
    }
  }

  const handleCanvasMouseUp = () => {
    setIsDraggingCanvas(false)
  }

  const handleCanvasMouseLeave = () => {
    setIsDraggingCanvas(false)
  }

  const handleTaskClick = (e: React.MouseEvent, taskId: string) => {
    // Don't open details if user is dragging
    if (draggedTask) return
    
    // Prevent event from bubbling to drag handlers
    e.stopPropagation()
    setSelectedTaskId(taskId)
  }

  const handleAddTaskClick = (e: React.MouseEvent) => {
    // Prevent event from bubbling to drag handlers
    e.stopPropagation()
    setShowCreateTaskForm(true)
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

  const getPriorityIndicatorColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-400'
      case 'MEDIUM': return 'bg-yellow-400'
      case 'HIGH': return 'bg-orange-400'
      case 'URGENT': return 'bg-red-400'
      default: return 'bg-gray-400'
    }
  }

  return (
    <div className="flex-1 bg-gradient-to-br from-slate-50 to-gray-100 overflow-hidden">
      <div 
        ref={canvasRef}
        className={`h-full overflow-auto p-6 ${isDraggingCanvas ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseLeave}
        style={{ userSelect: isDraggingCanvas ? 'none' : 'auto' }}
      >
        <div className="flex gap-5" style={{ minWidth: `${board.columns.length * 330}px` }}>
          {board.columns.map(column => (
            <div 
              key={column.id} 
              className="w-80 flex-shrink-0 flex flex-col"
            >
              {/* Column Header */}
              <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl p-4 mb-4 shadow-sm sticky top-2 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full shadow-sm ${column.dotColor}`}></div>
                    <h3 className="font-semibold text-slate-800 tracking-tight">{column.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
                      {getTasksByColumn(column.id).length}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Column Content */}
              <div 
                className={`space-y-3 rounded-xl p-3 transition-all duration-200 min-h-[120px] ${
                  dragOverColumn === column.id 
                    ? 'bg-blue-50/80 border-2 border-blue-200 border-dashed shadow-md' 
                    : 'bg-white/30 border border-white/40'
                }`}
                onMouseDown={(e) => e.stopPropagation()}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {getTasksByColumn(column.id).length === 0 ? (
                  <button
                    onClick={handleAddTaskClick}
                    className="flex items-center justify-center h-24 text-slate-400 hover:text-slate-600 hover:bg-slate-50/50 rounded-lg transition-all duration-200 border-2 border-dashed border-transparent hover:border-slate-200 group w-full"
                  >
                    <div className="text-center">
                      <svg className="w-8 h-8 mx-auto mb-2 opacity-40 group-hover:opacity-60 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-xs font-medium group-hover:text-slate-700 transition-colors">Add new task</p>
                    </div>
                  </button>
                ) : null}
                {getTasksByColumn(column.id).map(task => (
                  <div 
                    key={task.id} 
                    className={`bg-white rounded-xl border border-gray-200/60 p-4 hover:border-blue-200 hover:shadow-lg transition-all duration-300 group cursor-pointer relative overflow-hidden ${
                      draggedTask?.id === task.id ? 'opacity-50 rotate-2 scale-105 shadow-xl' : ''
                    }`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                    onClick={(e) => handleTaskClick(e, task.id)}
                  >
                    {/* Priority indicator bar */}
                    <div className={`absolute top-0 left-0 right-0 h-1 ${getPriorityIndicatorColor(task.priority)}`}></div>
                    
                    {/* Header with title and assignee */}
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-slate-800 text-sm leading-snug group-hover:text-slate-900 flex-1 pr-2">
                        {task.title}
                      </h4>
                      {task.assignee && (
                        <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center text-xs font-medium text-white shadow-sm border-2 border-white">
                          {task.assignee.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      )}
                    </div>
                    
                    {/* Description */}
                    {task.description && (
                      <p className="text-xs text-slate-600 mb-3 leading-relaxed line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    
                    {/* Tags and metadata */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        {task.dueDate && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-full">
                            <svg className="w-3 h-3 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs text-slate-600 font-medium">
                              {new Date(task.dueDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        {task.assignee ? (
                          <span className="text-xs text-slate-500 font-medium">{task.assignee.name}</span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Unassigned</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(task.createdAt).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    
                    {/* Hover overlay with drag hint */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none rounded-xl">
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 text-blue-400/60">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Details Modal */}
      {selectedTaskId && (
        <TaskDetails
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}

      {/* Create Task Modal */}
      {showCreateTaskForm && (
        <CreateTaskForm
          targetId={board.targetId}
          triggerButton={null}
          autoOpen={true}
          onClose={() => setShowCreateTaskForm(false)}
        />
      )}
    </div>
  )
}