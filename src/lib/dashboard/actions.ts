'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth/server-utils'
import {
  DashboardData,
  DashboardActionResponse,
  ProjectActionResponse,
  StandupActionResponse,
  CreateProjectFormData,
  UpdateProjectFormData,
  QuickStandupFormData,
  UserContext
} from './types'
import {
  getUserProjectsQuery,
  getRecentActivityQuery,
  getOrganizationStatsQuery,
  getUpcomingDeadlinesQuery,
  getTodaysStandupQuery,
  getUserStandupHistoryQuery
} from './queries'
import {
  validateProjectName,
  validateVision,
  getAvailableQuickActions,
  prioritizeProjects
} from './utils'

// ============================================================================
// DASHBOARD DATA ACTIONS
// ============================================================================

export async function getDashboardDataAction(): Promise<DashboardData | null> {
  try {
    const user = await getSessionUser()
    if (!user) return null

    // Fetch all dashboard data in parallel for optimal performance
    const [projects, recentActivity, organizationStats, upcomingDeadlines] = await Promise.all([
      getUserProjectsQuery(user.id),
      getRecentActivityQuery(user.id, 15),
      getOrganizationStatsQuery(user.id),
      getUpcomingDeadlinesQuery(user.id, 7)
    ])

    const userContext: UserContext = {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      organization: {
        id: user.organizationId,
        // @ts-ignore
        name: user.organization?.name || '',
        memberCount: organizationStats.totalMembers
      }
    }

    return {
      user: userContext,
      projects: prioritizeProjects(projects),
      recentActivity,
      organizationStats,
      quickActions: getAvailableQuickActions(userContext),
      upcomingDeadlines
    }
  } catch (error) {
    console.error('Get dashboard data error:', error)
    return null
  }
}

export async function getUserProjectsAction() {
  try {
    const user = await getSessionUser()
    if (!user) return null

    const projects = await getUserProjectsQuery(user.id)
    return prioritizeProjects(projects)
  } catch (error) {
    console.error('Get user projects error:', error)
    return null
  }
}

export async function getRecentActivityAction(limit: number = 20) {
  try {
    const user = await getSessionUser()
    if (!user) return null

    return await getRecentActivityQuery(user.id, limit)
  } catch (error) {
    console.error('Get recent activity error:', error)
    return null
  }
}

export async function getOrganizationStatsAction() {
  try {
    const user = await getSessionUser()
    if (!user) return null

    return await getOrganizationStatsQuery(user.id)
  } catch (error) {
    console.error('Get organization stats error:', error)
    return null
  }
}

// ============================================================================
// PROJECT MANAGEMENT ACTIONS
// ============================================================================

export async function createProjectAction(formData: CreateProjectFormData): Promise<ProjectActionResponse> {
  try {
    const user = await getSessionUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validation
    const nameValidation = validateProjectName(formData.name)
    if (!nameValidation.isValid) {
      return { success: false, error: nameValidation.error }
    }

    const visionValidation = validateVision(formData.vision)
    if (!visionValidation.isValid) {
      return { success: false, error: visionValidation.error }
    }

    // Check for duplicate project names in organization
    const existingProject = await prisma.project.findFirst({
      where: {
        organizationId: user.organizationId,
        name: formData.name.trim(),
        status: { not: 'ARCHIVED' }
      }
    })

    if (existingProject) {
      return {
        success: false,
        error: 'A project with this name already exists in your organization'
      }
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        name: formData.name.trim(),
        vision: formData.vision.trim(),
        description: formData.description?.trim() || null,
        organizationId: user.organizationId,
        creatorId: user.id
      },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true }
        },
        organization: {
          select: {
            users: { select: { id: true } }
          }
        }
      }
    })

    // Create default standup template for the project
    await prisma.standupTemplate.create({
      data: {
        name: 'Daily Standup',
        description: `Default standup template for ${project.name}`,
        isDefault: true,
        organizationId: user.organizationId,
        projectId: project.id,
        questions: [
          {
            id: 'yesterday',
            text: 'What did you accomplish yesterday?',
            type: 'text',
            required: true,
            order: 1
          },
          {
            id: 'today',
            text: 'What will you work on today?',
            type: 'text',
            required: true,
            order: 2
          },
          {
            id: 'blockers',
            text: 'Any blockers or challenges?',
            type: 'text',
            required: false,
            order: 3
          }
        ]
      }
    })

    const projectSummary = {
      id: project.id,
      name: project.name,
      vision: project.vision,
      status: project.status as 'ACTIVE' | 'COMPLETED' | 'ARCHIVED',
      targetCount: 0,
      completedTargets: 0,
      taskCount: 0,
      completedTasks: 0,
      lastActivity: project.updatedAt,
      memberCount: project.organization.users.length,
      isOwner: project.creatorId === user.id
    }

    revalidatePath('/dashboard')
    return { success: true, project: projectSummary }
  } catch (error) {
    console.error('Create project error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while creating the project'
    }
  }
}

export async function updateProjectAction(formData: UpdateProjectFormData): Promise<ProjectActionResponse> {
  try {
    const user = await getSessionUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    // Verify user has access to the project
    const existingProject = await prisma.project.findFirst({
      where: {
        id: formData.id,
        organization: {
          users: { some: { id: user.id } }
        }
      }
    })

    if (!existingProject) {
      return { success: false, error: 'Project not found or access denied' }
    }

    // Validation for provided fields
    const updates: any = {}

    if (formData.name !== undefined) {
      const nameValidation = validateProjectName(formData.name)
      if (!nameValidation.isValid) {
        return { success: false, error: nameValidation.error }
      }
      updates.name = formData.name.trim()
    }

    if (formData.vision !== undefined) {
      const visionValidation = validateVision(formData.vision)
      if (!visionValidation.isValid) {
        return { success: false, error: visionValidation.error }
      }
      updates.vision = formData.vision.trim()
    }

    if (formData.description !== undefined) {
      updates.description = formData.description?.trim() || null
    }

    if (formData.status !== undefined) {
      updates.status = formData.status
    }

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id: formData.id },
      data: updates,
      include: {
        targets: {
          include: {
            tasks: { select: { completedAt: true } }
          }
        },
        organization: {
          select: {
            users: { select: { id: true } }
          }
        }
      }
    })

    const projectSummary = {
      id: updatedProject.id,
      name: updatedProject.name,
      vision: updatedProject.vision,
      status: updatedProject.status as 'ACTIVE' | 'COMPLETED' | 'ARCHIVED',
      targetCount: updatedProject.targets.length,
      completedTargets: updatedProject.targets.filter(t => t.status === 'COMPLETED').length,
      taskCount: updatedProject.targets.reduce((sum, target) => sum + target.tasks.length, 0),
      completedTasks: updatedProject.targets.reduce(
        (sum, target) => sum + target.tasks.filter(task => task.completedAt !== null).length,
        0
      ),
      lastActivity: updatedProject.updatedAt,
      memberCount: updatedProject.organization.users.length,
      isOwner: updatedProject.creatorId === user.id
    }

    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/project/${formData.id}`)
    return { success: true, project: projectSummary }
  } catch (error) {
    console.error('Update project error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while updating the project'
    }
  }
}

export async function archiveProjectAction(projectId: string): Promise<DashboardActionResponse> {
  try {
    const user = await getSessionUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    // Verify user has access and is owner/admin
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organization: {
          users: { some: { id: user.id } }
        }
      }
    })

    if (!project) {
      return { success: false, error: 'Project not found or access denied' }
    }

    if (project.creatorId !== user.id && user.role !== 'OWNER' && user.role !== 'ADMIN') {
      return { success: false, error: 'Only project creators, owners, or admins can archive projects' }
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'ARCHIVED' }
    })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Archive project error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while archiving the project'
    }
  }
}

// ============================================================================
// STANDUP ACTIONS
// ============================================================================

export async function getTodaysStandupAction(projectId?: string) {
  try {
    const user = await getSessionUser()
    if (!user) return null

    return await getTodaysStandupQuery(user.id, projectId)
  } catch (error) {
    console.error('Get todays standup error:', error)
    return null
  }
}

export async function submitQuickStandupAction(formData: QuickStandupFormData): Promise<StandupActionResponse> {
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

    const today = new Date().toISOString().split('T')[0]

    // Get or create today's standup
    let standup = await prisma.standup.findFirst({
      where: {
        projectId: formData.projectId,
        date: new Date(today)
      }
    })

    if (!standup) {
      // Get default template for the project
      const template = await prisma.standupTemplate.findFirst({
        where: {
          projectId: formData.projectId,
          isDefault: true
        }
      })

      if (!template) {
        return { success: false, error: 'No standup template found for this project' }
      }

      standup = await prisma.standup.create({
        data: {
          date: new Date(today),
          templateId: template.id,
          projectId: formData.projectId,
          organizationId: user.organizationId,
          // Store snapshot of questions at time of standup creation
          questionsSnapshot: template.questions
        }
      })
    }

    // Check if user already submitted today
    const existingResponse = await prisma.standupResponse.findFirst({
      where: {
        standupId: standup.id,
        userId: user.id
      }
    })

    if (existingResponse) {
      // Update existing response
      await prisma.standupResponse.update({
        where: { id: existingResponse.id },
        data: {
          responses: formData.responses,
          submittedAt: new Date()
        }
      })
    } else {
      // Create new response
      await prisma.standupResponse.create({
        data: {
          standupId: standup.id,
          userId: user.id,
          responses: formData.responses,
          submittedAt: new Date()
        }
      })
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/standups')

    return {
      success: true,
      standup: {
        id: standup.id,
        date: today,
        projectId: formData.projectId,
        submitted: true
      }
    }
  } catch (error) {
    console.error('Submit quick standup error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while submitting your standup'
    }
  }
}

export async function getStandupHistoryAction(limit: number = 10) {
  try {
    const user = await getSessionUser()
    if (!user) return null

    return await getUserStandupHistoryQuery(user.id, limit)
  } catch (error) {
    console.error('Get standup history error:', error)
    return null
  }
}

// ============================================================================
// NAVIGATION ACTIONS
// ============================================================================

export async function requireDashboardAuth() {
  const user = await getSessionUser()

  if (!user) {
    redirect('/login')
  }

  return user
}

export async function redirectToProject(projectId: string) {
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

  redirect(`/dashboard/project/${projectId}`)
}