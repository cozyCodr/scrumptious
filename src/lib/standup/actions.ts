'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth/server-utils'

export interface StandupData {
  id: string
  userId: string
  userName: string
  timestamp: string
  responses: {
    accomplished: string
    today: string
    blockers: string
  }
  taskLinks?: {
    taskId: string
    taskTitle: string
    targetName: string
    projectId: string
    targetId: string
  }[]
}

export interface ProjectStandupSummary {
  projectId: string
  projectName: string
  standupCount: number
  lastStandupDate: string | null
}

export interface Question {
  id: string
  text: string
  type: 'text' | 'textarea' | 'multiple_choice' | 'task'
  required: boolean
  order: number
  options?: string[]
}

export interface QuestionnaireTemplate {
  id: string
  name: string
  description: string
  questions: Question[]
  isDefault: boolean
  projectId: string
}

// Get user's projects for standup selection
export async function getUserProjectsAction() {
  try {
    const user = await getSessionUser()
    if (!user) return []

    const projects = await prisma.project.findMany({
      where: {
        organizationId: user.organizationId,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        standups: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return projects.map(project => ({
      id: project.id,
      name: project.name,
      lastStandupDate: project.standups[0]?.createdAt.toISOString() || null
    }))
  } catch (error) {
    console.error('Get user projects error:', error)
    return []
  }
}

// Get standup data for a specific project
export async function getProjectStandupsAction(projectId?: string, limit = 20, offset = 0) {
  try {
    const user = await getSessionUser()
    if (!user) return { standups: [], hasMore: false }

    // If no projectId specified, get standups from all user's projects
    const whereClause = projectId
      ? {
        projectId,
        project: {
          organizationId: user.organizationId
        }
      }
      : {
        project: {
          organizationId: user.organizationId
        }
      }

    const standups = await prisma.standup.findMany({
      where: whereClause,
      include: {
        project: {
          select: { id: true, name: true }
        },
        responses: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { submittedAt: 'asc' }
        }
      },
      orderBy: { date: 'desc' },
      take: limit + 1,
      skip: offset
    })

    const hasMore = standups.length > limit
    const standupData = standups.slice(0, limit)

    // Transform the data to match the UI format
    const formattedStandups: StandupData[] = []

    for (const standup of standupData) {
      for (const response of standup.responses) {
        // Parse the responses JSON
        const responses = Array.isArray(response.responses)
          ? response.responses
          : []

        // @ts-ignore
        const accomplishedAnswer = responses.find((r: any) => r.questionId === 'q1')?.value || ''
        // @ts-ignore
        const todayAnswer = responses.find((r: any) => r.questionId === 'q2')?.value || ''
        // @ts-ignore
        const blockersAnswer = responses.find((r: any) => r.questionId === 'q3')?.value || ''

        formattedStandups.push({
          id: `${standup.id}-${response.userId}`,
          userId: response.user.id,
          userName: `${response.user.firstName} ${response.user.lastName}`,
          timestamp: response.submittedAt.toISOString(),
          responses: {
            accomplished: accomplishedAnswer,
            today: todayAnswer,
            blockers: blockersAnswer
          }
          // Note: taskLinks would need to be implemented separately if needed
        })
      }
    }

    return {
      standups: formattedStandups,
      hasMore
    }
  } catch (error) {
    console.error('Get project standups error:', error)
    return { standups: [], hasMore: false }
  }
}

// Get current selected project (from user preferences or most recent)
export async function getCurrentProjectAction() {
  try {
    const user = await getSessionUser()
    if (!user) return null

    // For now, just return the most recently created project
    // In the future, this could be stored in user preferences
    const project = await prisma.project.findFirst({
      where: {
        organizationId: user.organizationId,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return project
  } catch (error) {
    console.error('Get current project error:', error)
    return null
  }
}

// Update user's selected project preference
export async function setCurrentProjectAction(projectId: string) {
  try {
    const user = await getSessionUser()
    if (!user) return { success: false, error: 'Authentication required' }

    // Verify user has access to this project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: user.organizationId
      }
    })

    if (!project) {
      return { success: false, error: 'Project not found or access denied' }
    }

    // For now, we'll just return success since we don't have user preferences table
    // In the future, you might want to store this in a user preferences table
    revalidatePath('/dashboard/standups')
    return { success: true }
  } catch (error) {
    console.error('Set current project error:', error)
    return { success: false, error: 'Failed to update project preference' }
  }
}

// Get questionnaire template for a project
export async function getQuestionnaireTemplateAction(projectId: string) {
  try {
    const user = await getSessionUser()
    if (!user) return null

    // Verify user has access to this project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: user.organizationId
      }
    })

    if (!project) return null

    // Look for existing template for this project
    let template = await prisma.standupTemplate.findFirst({
      where: {
        projectId,
        organizationId: user.organizationId
      }
    })

    // If no template exists, create a default one
    if (!template) {
      const defaultQuestions = [
        {
          id: 'q1',
          text: 'What did you accomplish yesterday?',
          type: 'textarea',
          required: true,
          order: 1
        },
        {
          id: 'q2',
          text: 'What will you work on today?',
          type: 'textarea',
          required: true,
          order: 2
        },
        {
          id: 'q3',
          text: 'Any blockers or challenges?',
          type: 'textarea',
          required: false,
          order: 3
        }
      ]

      template = await prisma.standupTemplate.create({
        data: {
          name: 'Daily Standup',
          description: 'Standard daily standup questions',
          isDefault: true,
          questions: defaultQuestions,
          organizationId: user.organizationId,
          projectId
        }
      })
    }

    // Convert to our interface format
    const questionnaireTemplate: QuestionnaireTemplate = {
      id: template.id,
      name: template.name,
      description: template.description || '',
      isDefault: template.isDefault,
      projectId,
      // @ts-ignore
      questions: Array.isArray(template.questions) ? template.questions as Question[] : []
    }

    return questionnaireTemplate
  } catch (error) {
    console.error('Get questionnaire template error:', error)
    return null
  }
}

// Save questionnaire template for a project
export async function saveQuestionnaireTemplateAction(template: QuestionnaireTemplate) {
  try {
    const user = await getSessionUser()
    if (!user) return { success: false, error: 'Authentication required' }

    // Verify user has access to this project
    const project = await prisma.project.findFirst({
      where: {
        id: template.projectId,
        organizationId: user.organizationId
      }
    })

    if (!project) {
      return { success: false, error: 'Project not found or access denied' }
    }

    // Check if this is an existing template with a valid ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(template.id)

    if (isValidObjectId) {
      // Update existing template
      await prisma.standupTemplate.update({
        where: {
          id: template.id
        },
        data: {
          name: template.name,
          description: template.description,
          // @ts-ignore
          questions: template.questions,
          isDefault: template.isDefault
        }
      })
    } else {
      // Check if a template already exists for this project
      const existingTemplate = await prisma.standupTemplate.findFirst({
        where: {
          projectId: template.projectId,
          organizationId: user.organizationId
        }
      })

      if (existingTemplate) {
        // Update existing template
        await prisma.standupTemplate.update({
          where: {
            id: existingTemplate.id
          },
          data: {
            name: template.name,
            description: template.description,
            // @ts-ignore
            questions: template.questions,
            isDefault: template.isDefault
          }
        })
      } else {
        // Create new template
        await prisma.standupTemplate.create({
          data: {
            name: template.name,
            description: template.description,
            // @ts-ignore
            questions: template.questions,
            isDefault: template.isDefault,
            organizationId: user.organizationId,
            projectId: template.projectId
          }
        })
      }
    }

    revalidatePath(`/dashboard/project/${template.projectId}/questionnaire`)
    return { success: true }
  } catch (error) {
    console.error('Save questionnaire template error:', error)
    return { success: false, error: 'Failed to save template' }
  }
}