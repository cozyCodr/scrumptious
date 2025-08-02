// Kanban board types for clean, modular architecture

export interface KanbanColumn {
  id: string
  name: string
  color: string
  dotColor: string
  order: number
}

export interface KanbanTask {
  id: string
  title: string
  description: string
  columnId: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  order: number
  dueDate?: Date
  completedAt?: Date
  assignee?: {
    id: string
    name: string
  }
  createdAt: Date
}

export interface KanbanBoard {
  targetId: string
  columns: KanbanColumn[]
  tasks: KanbanTask[]
}

export interface UpdateTaskColumnData {
  taskId: string
  newColumnId: string
  newOrder?: number
}

export interface CreateColumnData {
  targetId: string
  name: string
  color?: string
  dotColor?: string
  order?: number
}

export interface UpdateColumnData {
  targetId: string
  columnId: string
  name?: string
  color?: string
  dotColor?: string
  order?: number
}

export interface KanbanActionResponse {
  success: boolean
  error?: string
  data?: any
}