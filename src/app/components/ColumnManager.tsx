'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  createKanbanColumnAction, 
  updateKanbanColumnAction, 
  deleteKanbanColumnAction 
} from '@/lib/kanban/actions'
import { KanbanColumn } from '@/lib/kanban/types'

interface ColumnManagerProps {
  targetId: string
  columns: KanbanColumn[]
  triggerButton: React.ReactNode | null
  autoOpen?: boolean
  onClose?: () => void
}

const COLUMN_COLORS = [
  { bg: 'bg-gray-50', dot: 'bg-slate-400', label: 'Gray' },
  { bg: 'bg-blue-50', dot: 'bg-blue-500', label: 'Blue' },
  { bg: 'bg-green-50', dot: 'bg-green-500', label: 'Green' },
  { bg: 'bg-yellow-50', dot: 'bg-yellow-500', label: 'Yellow' },
  { bg: 'bg-purple-50', dot: 'bg-purple-500', label: 'Purple' },
  { bg: 'bg-red-50', dot: 'bg-red-500', label: 'Red' },
  { bg: 'bg-orange-50', dot: 'bg-orange-500', label: 'Orange' },
  { bg: 'bg-pink-50', dot: 'bg-pink-500', label: 'Pink' }
]

export default function ColumnManager({ targetId, columns, triggerButton, autoOpen = false, onClose }: ColumnManagerProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Form state
  const [columnName, setColumnName] = useState('')
  const [selectedColor, setSelectedColor] = useState(COLUMN_COLORS[0])

  useEffect(() => {
    if (autoOpen) {
      setIsOpen(true)
    }
  }, [autoOpen])

  const resetForm = () => {
    setColumnName('')
    setSelectedColor(COLUMN_COLORS[0])
    setIsCreating(false)
    setEditingColumn(null)
  }

  const handleCreateColumn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!columnName.trim()) return

    setIsLoading(true)
    try {
      const result = await createKanbanColumnAction({
        targetId,
        name: columnName.trim(),
        color: selectedColor.bg,
        dotColor: selectedColor.dot
      })

      if (result.success) {
        resetForm()
        router.refresh()
      } else {
        console.error(result.error)
      }
    } catch (error) {
      console.error('Error creating column:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateColumn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingColumn || !columnName.trim()) return

    setIsLoading(true)
    try {
      const result = await updateKanbanColumnAction({
        targetId,
        columnId: editingColumn.id,
        name: columnName.trim(),
        color: selectedColor.bg,
        dotColor: selectedColor.dot
      })

      if (result.success) {
        resetForm()
        router.refresh()
      } else {
        console.error(result.error)
      }
    } catch (error) {
      console.error('Error updating column:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteColumn = async (columnId: string) => {
    if (!confirm('Are you sure you want to delete this column? Tasks in this column will be moved to the first column.')) {
      return
    }

    setIsLoading(true)
    try {
      const result = await deleteKanbanColumnAction(targetId, columnId)

      if (result.success) {
        router.refresh()
      } else {
        alert(result.error || 'Failed to delete column')
      }
    } catch (error) {
      console.error('Error deleting column:', error)
      alert('An error occurred while deleting the column')
    } finally {
      setIsLoading(false)
    }
  }

  const startEdit = (column: KanbanColumn) => {
    setEditingColumn(column)
    setColumnName(column.name)
    const colorMatch = COLUMN_COLORS.find(c => c.bg === column.color && c.dot === column.dotColor)
    if (colorMatch) {
      setSelectedColor(colorMatch)
    }
    setIsCreating(false)
  }

  const startCreate = () => {
    resetForm()
    setIsCreating(true)
  }

  const handleClose = () => {
    setIsOpen(false)
    resetForm()
    if (onClose) onClose()
  }

  return (
    <>
      {triggerButton && (
        <div onClick={() => setIsOpen(true)}>
          {triggerButton}
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-white/10 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-slate-800">Manage Columns</h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Current Columns */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-slate-800 mb-4">Current Columns</h3>
                <div className="space-y-3">
                  {columns.map((column) => (
                    <div key={column.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${column.dotColor}`}></div>
                        <span className="font-medium text-slate-800">{column.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(column)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                        >
                          Edit
                        </button>
                        {columns.length > 1 && (
                          <button
                            onClick={() => handleDeleteColumn(column.id)}
                            disabled={isLoading}
                            className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Column Button */}
              {!isCreating && !editingColumn && (
                <button
                  onClick={startCreate}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors font-medium"
                >
                  + Add New Column
                </button>
              )}

              {/* Create/Edit Form */}
              {(isCreating || editingColumn) && (
                <form onSubmit={editingColumn ? handleUpdateColumn : handleCreateColumn} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Column Name
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      A descriptive name for this stage in your workflow
                    </p>
                    <input
                      type="text"
                      value={columnName}
                      onChange={(e) => setColumnName(e.target.value)}
                      placeholder="Enter column name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      maxLength={50}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Color
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Visual theme to help distinguish this column
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {COLUMN_COLORS.map((color) => (
                        <button
                          key={color.label}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            selectedColor.label === color.label
                              ? 'border-blue-500 ring-2 ring-blue-200'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${color.dot}`}></div>
                            <span className="text-xs font-medium text-slate-600">{color.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {isLoading ? 'Saving...' : editingColumn ? 'Update Column' : 'Create Column'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}