// Kanban server actions for column and task management
'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth/utils'
import { prisma } from '@/lib/prisma'
import {
  KanbanColumn,
  KanbanActionResponse,
  CreateColumnData,
  UpdateColumnData,
  UpdateTaskColumnData
} from './types'

/**
 * Verify JWT token and get user
 */
async function verifyToken() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) {
    return null
  }

  const payload = await verifyJWT(token)
  if (!payload) {
    return null
  }

  // Get fresh user data from database
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { organization: true },
  })

  if (!user || !user.isActive) {
    return null
  }

  return user
}

/**
 * Get kanban board data for a target
 */
export async function getKanbanBoardAction(targetId: string): Promise<KanbanActionResponse> {
  try {
    const user = await verifyToken()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    // Get target with its kanban columns and tasks
    const target = await prisma.target.findFirst({
      where: {
        id: targetId,
        project: {
          organizationId: user.organizationId
        }
      },
      include: {
        project: {
          select: { id: true, name: true }
        },
        tasks: {
          include: {
            assignee: {
              select: { id: true, firstName: true, lastName: true }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!target) {
      return { success: false, error: 'Target not found' }
    }

    // Parse kanban columns from JSON
    const columns = Array.isArray(target.kanbanColumns)
      // @ts-ignore
      ? target.kanbanColumns as KanbanColumn[]
      : JSON.parse(target.kanbanColumns as string) as KanbanColumn[]

    // Transform tasks to match our interface
    const transformedTasks = target.tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description || '',
      columnId: task.columnId,
      priority: task.priority,
      order: task.order,
      dueDate: task.dueDate,
      completedAt: task.completedAt,
      assignee: task.assignee ? {
        id: task.assignee.id,
        name: `${task.assignee.firstName} ${task.assignee.lastName}`
      } : undefined,
      createdAt: task.createdAt
    }))

    return {
      success: true,
      data: {
        targetId: target.id,
        columns: columns.sort((a, b) => a.order - b.order),
        tasks: transformedTasks
      }
    }
  } catch (error) {
    console.error('Error getting kanban board:', error)
    return { success: false, error: 'Failed to get kanban board' }
  }
}

/**
 * Create a new kanban column
 */
export async function createKanbanColumnAction(data: CreateColumnData): Promise<KanbanActionResponse> {
  try {
    const user = await verifyToken()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    // Get current target to access existing columns
    const target = await prisma.target.findFirst({
      where: {
        id: data.targetId,
        project: {
          organizationId: user.organizationId
        }
      },
      include: {
        project: { select: { id: true } }
      }
    })

    if (!target) {
      return { success: false, error: 'Target not found' }
    }

    // Parse existing columns
    const existingColumns = Array.isArray(target.kanbanColumns)
      // @ts-ignore
      ? target.kanbanColumns as KanbanColumn[]
      : JSON.parse(target.kanbanColumns as string) as KanbanColumn[]

    // Create new column
    const newColumn: KanbanColumn = {
      id: `column_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      color: data.color || 'bg-gray-50',
      dotColor: data.dotColor || 'bg-gray-400',
      order: data.order ?? existingColumns.length
    }

    // Add new column to existing ones
    const updatedColumns = [...existingColumns, newColumn].sort((a, b) => a.order - b.order)

    // Update target with new columns
    await prisma.target.update({
      where: { id: data.targetId },
      data: {
        kanbanColumns: JSON.stringify(updatedColumns)
      }
    })

    revalidatePath(`/dashboard/project/${target.projectId}/target/${data.targetId}`)

    return { success: true, data: newColumn }
  } catch (error) {
    console.error('Error creating kanban column:', error)
    return { success: false, error: 'Failed to create column' }
  }
}

/**
 * Update kanban column
 */
export async function updateKanbanColumnAction(data: UpdateColumnData): Promise<KanbanActionResponse> {
  try {
    const user = await verifyToken()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    // Get current target
    const target = await prisma.target.findFirst({
      where: {
        id: data.targetId,
        project: {
          organizationId: user.organizationId
        }
      },
      include: {
        project: { select: { id: true } }
      }
    })

    if (!target) {
      return { success: false, error: 'Target not found' }
    }

    // Parse existing columns
    const existingColumns = Array.isArray(target.kanbanColumns)
      // @ts-ignore
      ? target.kanbanColumns as KanbanColumn[]
      : JSON.parse(target.kanbanColumns as string) as KanbanColumn[]

    // Update the specific column
    const updatedColumns = existingColumns.map(col =>
      col.id === data.columnId
        ? {
          ...col,
          ...(data.name && { name: data.name }),
          ...(data.color && { color: data.color }),
          ...(data.dotColor && { dotColor: data.dotColor }),
          ...(data.order !== undefined && { order: data.order })
        }
        : col
    ).sort((a, b) => a.order - b.order)

    // Update target
    await prisma.target.update({
      where: { id: data.targetId },
      data: {
        kanbanColumns: JSON.stringify(updatedColumns)
      }
    })

    revalidatePath(`/dashboard/project/${target.projectId}/target/${data.targetId}`)

    const updatedColumn = updatedColumns.find(col => col.id === data.columnId)
    return { success: true, data: updatedColumn }
  } catch (error) {
    console.error('Error updating kanban column:', error)
    return { success: false, error: 'Failed to update column' }
  }
}

/**
 * Delete kanban column (and move tasks to first column)
 */
export async function deleteKanbanColumnAction(targetId: string, columnId: string): Promise<KanbanActionResponse> {
  try {
    const user = await verifyToken()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    // Get current target
    const target = await prisma.target.findFirst({
      where: {
        id: targetId,
        project: {
          organizationId: user.organizationId
        }
      },
      include: {
        project: { select: { id: true } }
      }
    })

    if (!target) {
      return { success: false, error: 'Target not found' }
    }

    // Parse existing columns
    const existingColumns = Array.isArray(target.kanbanColumns)
      // @ts-ignore
      ? target.kanbanColumns as KanbanColumn[]
      : JSON.parse(target.kanbanColumns as string) as KanbanColumn[]

    // Don't allow deletion if it's the only column
    if (existingColumns.length <= 1) {
      return { success: false, error: 'Cannot delete the last column' }
    }

    // Remove the column
    const updatedColumns = existingColumns.filter(col => col.id !== columnId)
    const firstColumnId = updatedColumns[0]?.id

    if (!firstColumnId) {
      return { success: false, error: 'No columns available' }
    }

    // Move all tasks from deleted column to first column
    await prisma.task.updateMany({
      where: {
        targetId: targetId,
        columnId: columnId
      },
      data: { columnId: firstColumnId }
    })

    // Update target with remaining columns
    await prisma.target.update({
      where: { id: targetId },
      data: {
        kanbanColumns: JSON.stringify(updatedColumns)
      }
    })

    revalidatePath(`/dashboard/project/${target.projectId}/target/${targetId}`)

    return { success: true }
  } catch (error) {
    console.error('Error deleting kanban column:', error)
    return { success: false, error: 'Failed to delete column' }
  }
}

/**
 * Update task column (for drag and drop)
 */
export async function updateTaskColumnAction(data: UpdateTaskColumnData): Promise<KanbanActionResponse> {
  try {
    const user = await verifyToken()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    // Verify task belongs to user's organization
    const task = await prisma.task.findFirst({
      where: {
        id: data.taskId,
        target: {
          project: {
            organizationId: user.organizationId
          }
        }
      },
      include: {
        target: {
          include: {
            project: { select: { id: true } }
          }
        }
      }
    })

    if (!task?.target.project) {
      return { success: false, error: 'Task not found' }
    }

    // Update task column and order
    await prisma.task.update({
      where: { id: data.taskId },
      data: {
        columnId: data.newColumnId,
        ...(data.newOrder !== undefined && { order: data.newOrder })
      }
    })

    revalidatePath(`/dashboard/project/${task.target.projectId}/target/${task.targetId}`)

    return { success: true }
  } catch (error) {
    console.error('Error updating task column:', error)
    return { success: false, error: 'Failed to update task' }
  }
}