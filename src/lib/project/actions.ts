'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth/server-utils'

// Types
export interface CreateTargetFormData {
  projectId: string
  title: string
  description?: string
}

export interface ProjectActionResponse {
  success: boolean
  error?: string
  target?: any
}

// Get project details with targets and recent standups
export async function getProjectDetailsAction(projectId: string) {
  try {
    const user = await getSessionUser()
    if (!user) return null

    // Verify user has access to the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organization: {
          users: { some: { id: user.id } }
        }
      },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true }
        },
        organization: {
          select: { id: true, name: true }
        },
        targets: {
          include: {
            tasks: {
              select: { id: true, completedAt: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!project) return null

    // Get recent standups for this project
    const recentStandups = await prisma.standup.findMany({
      where: {
        projectId: projectId,
        date: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      include: {
        responses: {
          include: {
            user: {
              select: { firstName: true, lastName: true }
            }
          }
        }
      },
      orderBy: { date: 'desc' },
      take: 5
    })

    // Format targets
    const targets = project.targets.map(target => ({
      id: target.id,
      title: target.title,
      description: target.description || '',
      taskCount: target.tasks.length,
      completedTasks: target.tasks.filter(task => task.completedAt !== null).length,
      status: target.status,
      createdAt: target.createdAt
    }))

    // Format standups
    const standups = recentStandups.map(standup => ({
      id: standup.id,
      date: standup.date.toISOString().split('T')[0],
      responses: standup.responses.reduce((acc, response) => {
        const userName = `${response.user.firstName} ${response.user.lastName}`
        acc[userName] = response.responses
        return acc
      }, {} as Record<string, any>)
    }))

    return {
      project: {
        id: project.id,
        name: project.name,
        vision: project.vision,
        description: project.description,
        status: project.status,
        createdAt: project.createdAt,
        creator: project.creator,
        organization: project.organization
      },
      targets,
      standups,
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        organization: {
          name: project.organization.name
        }
      }
    }
  } catch (error) {
    console.error('Get project details error:', error)
    return null
  }
}

// Create a new target
export async function createTargetAction(formData: CreateTargetFormData): Promise<ProjectActionResponse> {
  try {
    const user = await getSessionUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    // Verify user has access to the project
    const project = await prisma.project.findFirst({
      where: {
        id: formData.projectId,
        organization: {
          users: { some: { id: user.id } }
        }
      }
    })

    if (!project) {
      return { success: false, error: 'Project not found or access denied' }
    }

    // Validation
    if (!formData.title || formData.title.trim().length < 3) {
      return { success: false, error: 'Title must be at least 3 characters long' }
    }

    if (formData.title.trim().length > 100) {
      return { success: false, error: 'Title must be less than 100 characters' }
    }

    // Create target
    const target = await prisma.target.create({
      data: {
        title: formData.title.trim(),
        description: formData.description?.trim() || '',
        projectId: formData.projectId
      },
      include: {
        tasks: {
          select: { id: true, completedAt: true }
        }
      }
    })

    const targetSummary = {
      id: target.id,
      title: target.title,
      description: target.description || '',
      taskCount: target.tasks.length,
      completedTasks: target.tasks.filter(task => task.completedAt !== null).length,
      status: target.status,
      createdAt: target.createdAt
    }

    revalidatePath(`/dashboard/project/${formData.projectId}`)
    return { success: true, target: targetSummary }
  } catch (error) {
    console.error('Create target error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while creating the target'
    }
  }
}

// Redirect helper for project access
export async function requireProjectAccess(projectId: string) {
  const user = await getSessionUser()
  
  if (!user) {
    redirect('/login')
  }

  // Verify access to project
  const hasAccess = await prisma.project.findFirst({
    where: {
      id: projectId,
      organization: {
        users: { some: { id: user.id } }
      }
    }
  })

  if (!hasAccess) {
    redirect('/dashboard')
  }

  return user
}