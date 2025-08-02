'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth/server-utils'

// Types
export interface CreateTaskFormData {
  targetId: string
  title: string
  description?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?: string
  assigneeId?: string
}

export interface TaskActionResponse {
  success: boolean
  error?: string
  task?: any
}

// Get target details with tasks
export async function getTargetDetailsAction(targetId: string) {
  try {
    const user = await getSessionUser()
    if (!user) return null

    // Verify user has access to the target
    const target = await prisma.target.findFirst({
      where: {
        id: targetId,
        project: {
          organization: {
            users: { some: { id: user.id } }
          }
        }
      },
      include: {
        project: {
          select: { id: true, name: true, vision: true }
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

    if (!target) return null

    // Format tasks
    const tasks = target.tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description || '',
      columnId: task.columnId,
      priority: task.priority,
      dueDate: task.dueDate,
      completedAt: task.completedAt,
      assignee: task.assignee ? {
        id: task.assignee.id,
        name: `${task.assignee.firstName} ${task.assignee.lastName}`
      } : null,
      createdAt: task.createdAt
    }))

    return {
      target: {
        id: target.id,
        title: target.title,
        description: target.description,
        status: target.status,
        createdAt: target.createdAt
      },
      project: target.project,
      tasks,
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
      }
    }
  } catch (error) {
    console.error('Get target details error:', error)
    return null
  }
}

// Create a new task
export async function createTaskAction(formData: CreateTaskFormData): Promise<TaskActionResponse> {
  try {
    const user = await getSessionUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    // Verify user has access to the target
    const target = await prisma.target.findFirst({
      where: {
        id: formData.targetId,
        project: {
          organization: {
            users: { some: { id: user.id } }
          }
        }
      },
      include: {
        project: { select: { id: true } }
      }
    })

    if (!target) {
      return { success: false, error: 'Target not found or access denied' }
    }

    // Validation
    if (!formData.title || formData.title.trim().length < 3) {
      return { success: false, error: 'Title must be at least 3 characters long' }
    }

    if (formData.title.trim().length > 100) {
      return { success: false, error: 'Title must be less than 100 characters' }
    }

    // Validate assignee if provided
    let assigneeId = null
    if (formData.assigneeId) {
      const assignee = await prisma.user.findFirst({
        where: {
          id: formData.assigneeId,
          organizationId: user.organizationId
        }
      })
      if (!assignee) {
        return { success: false, error: 'Invalid assignee selected' }
      }
      assigneeId = assignee.id
    }

    // Parse due date if provided
    let dueDate = null
    if (formData.dueDate) {
      dueDate = new Date(formData.dueDate)
      if (isNaN(dueDate.getTime())) {
        return { success: false, error: 'Invalid due date' }
      }
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        priority: formData.priority || 'MEDIUM',
        dueDate,
        targetId: formData.targetId,
        assigneeId
      },
      include: {
        assignee: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    })

    const taskSummary = {
      id: task.id,
      title: task.title,
      description: task.description || '',
      columnId: task.columnId,
      priority: task.priority,
      dueDate: task.dueDate,
      assignee: task.assignee ? {
        id: task.assignee.id,
        name: `${task.assignee.firstName} ${task.assignee.lastName}`
      } : null,
      createdAt: task.createdAt
    }

    revalidatePath(`/dashboard/project/${target.project.id}/target/${formData.targetId}`)
    return { success: true, task: taskSummary }
  } catch (error) {
    console.error('Create task error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while creating the task'
    }
  }
}

// Update task column (for drag and drop - deprecated, use kanban actions instead)
export async function updateTaskStatusAction(taskId: string, columnId: string): Promise<TaskActionResponse> {
  try {
    const user = await getSessionUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    // Verify user has access to the task
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        target: {
          project: {
            organization: {
              users: { some: { id: user.id } }
            }
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

    if (!task) {
      return { success: false, error: 'Task not found or access denied' }
    }

    // Update task column
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        columnId,
        // Set completedAt if moving to "done" column
        completedAt: columnId === 'done' ? new Date() : (columnId === 'todo' ? null : task.completedAt)
      },
      include: {
        assignee: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    })

    const taskSummary = {
      id: updatedTask.id,
      title: updatedTask.title,
      description: updatedTask.description || '',
      columnId: updatedTask.columnId,
      priority: updatedTask.priority,
      dueDate: updatedTask.dueDate,
      completedAt: updatedTask.completedAt,
      assignee: updatedTask.assignee ? {
        id: updatedTask.assignee.id,
        name: `${updatedTask.assignee.firstName} ${updatedTask.assignee.lastName}`
      } : null,
      createdAt: updatedTask.createdAt
    }

    revalidatePath(`/dashboard/project/${task.target.project.id}/target/${task.target.id}`)
    return { success: true, task: taskSummary }
  } catch (error) {
    console.error('Update task column error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while updating the task'
    }
  }
}

// Update task assignment
export async function updateTaskAssignmentAction(taskId: string, assigneeId: string | null): Promise<TaskActionResponse> {
  try {
    const user = await getSessionUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    // Verify user has access to the task
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        target: {
          project: {
            organization: {
              users: { some: { id: user.id } }
            }
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

    if (!task) {
      return { success: false, error: 'Task not found or access denied' }
    }

    // Validate assignee if provided
    if (assigneeId) {
      const assignee = await prisma.user.findFirst({
        where: {
          id: assigneeId,
          organizationId: user.organizationId
        }
      })
      if (!assignee) {
        return { success: false, error: 'Invalid assignee selected' }
      }
    }

    // Update task assignment
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { assigneeId },
      include: {
        assignee: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    })

    const taskSummary = {
      id: updatedTask.id,
      title: updatedTask.title,
      description: updatedTask.description || '',
      columnId: updatedTask.columnId,
      priority: updatedTask.priority,
      dueDate: updatedTask.dueDate,
      completedAt: updatedTask.completedAt,
      assignee: updatedTask.assignee ? {
        id: updatedTask.assignee.id,
        name: `${updatedTask.assignee.firstName} ${updatedTask.assignee.lastName}`
      } : null,
      createdAt: updatedTask.createdAt
    }

    revalidatePath(`/dashboard/project/${task.target.project.id}/target/${task.target.id}`)
    return { success: true, task: taskSummary }
  } catch (error) {
    console.error('Update task assignment error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while updating the task assignment'
    }
  }
}

// Get task details
export async function getTaskDetailsAction(taskId: string) {
  try {
    const user = await getSessionUser()
    if (!user) return null

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        target: {
          project: {
            organization: {
              users: { some: { id: user.id } }
            }
          }
        }
      },
      include: {
        assignee: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        target: {
          select: { id: true, title: true, project: { select: { id: true, name: true } } }
        }
      }
    })

    if (!task) return null

    return {
      id: task.id,
      title: task.title,
      description: task.description || '',
      columnId: task.columnId,
      priority: task.priority,
      dueDate: task.dueDate,
      completedAt: task.completedAt,
      assignee: task.assignee ? {
        id: task.assignee.id,
        name: `${task.assignee.firstName} ${task.assignee.lastName}`,
        email: task.assignee.email
      } : null,
      target: task.target,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    }
  } catch (error) {
    console.error('Get task details error:', error)
    return null
  }
}

// Get organization members for assignment
export async function getOrganizationMembersAction() {
  try {
    const user = await getSessionUser()
    if (!user) return []

    const members = await prisma.user.findMany({
      where: {
        organizationId: user.organizationId,
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    })

    return members.map(member => ({
      id: member.id,
      name: `${member.firstName} ${member.lastName}`,
      email: member.email,
      role: member.role
    }))
  } catch (error) {
    console.error('Get organization members error:', error)
    return []
  }
}

// Require target access helper
export async function requireTargetAccess(targetId: string) {
  const user = await getSessionUser()
  
  if (!user) {
    redirect('/login')
  }

  // Verify access to target
  const hasAccess = await prisma.target.findFirst({
    where: {
      id: targetId,
      project: {
        organization: {
          users: { some: { id: user.id } }
        }
      }
    }
  })

  if (!hasAccess) {
    redirect('/dashboard')
  }

  return user
}