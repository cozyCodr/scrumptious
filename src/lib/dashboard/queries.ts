// Database queries for dashboard operations
import { prisma } from '@/lib/prisma'
import { ProjectSummary, ActivityItem, OrganizationStats, DeadlineItem } from './types'

// Project queries
export const getUserProjectsQuery = async (userId: string): Promise<ProjectSummary[]> => {
  const projects = await prisma.project.findMany({
    where: {
      organization: {
        users: {
          some: { id: userId }
        }
      }
    },
    include: {
      creator: {
        select: { id: true, firstName: true, lastName: true }
      },
      targets: {
        select: {
          id: true,
          status: true,
          tasks: {
            select: { id: true, completedAt: true }
          }
        }
      },
      organization: {
        select: {
          users: {
            select: { id: true }
          }
        }
      }
    },
    orderBy: { updatedAt: 'desc' }
  })

  return projects.map(project => ({
    id: project.id,
    name: project.name,
    vision: project.vision,
    status: project.status as 'ACTIVE' | 'COMPLETED' | 'ARCHIVED',
    targetCount: project.targets.length,
    completedTargets: project.targets.filter(t => t.status === 'COMPLETED').length,
    taskCount: project.targets.reduce((sum, target) => sum + target.tasks.length, 0),
    completedTasks: project.targets.reduce(
      (sum, target) => sum + target.tasks.filter(task => task.completedAt !== null).length,
      0
    ),
    lastActivity: project.updatedAt,
    memberCount: project.organization.users.length,
    isOwner: project.creatorId === userId
  }))
}

export const getProjectByIdQuery = async (projectId: string, userId: string) => {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      organization: {
        users: {
          some: { id: userId }
        }
      }
    },
    include: {
      creator: {
        select: { id: true, firstName: true, lastName: true, email: true }
      },
      organization: {
        select: { id: true, name: true }
      },
      targets: {
        include: {
          tasks: {
            include: {
              assignee: {
                select: { id: true, firstName: true, lastName: true }
              }
            }
          }
        }
      }
    }
  })
}

// Activity queries
export const getRecentActivityQuery = async (userId: string, limit: number = 20): Promise<ActivityItem[]> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true }
  })

  if (!user) return []

  // Get recent standups
  const recentStandups = await prisma.standupResponse.findMany({
    where: {
      standup: {
        organizationId: user.organizationId
      }
    },
    include: {
      user: {
        select: { firstName: true, lastName: true, email: true }
      },
      standup: {
        include: {
          project: {
            select: { id: true, name: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  })

  // Get recent projects
  const recentProjects = await prisma.project.findMany({
    where: { organizationId: user.organizationId },
    include: {
      creator: {
        select: { firstName: true, lastName: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  // Convert to ActivityItems
  const activities: ActivityItem[] = []

  // Add standup activities
  recentStandups.forEach(response => {
    activities.push({
      id: response.id,
      type: 'STANDUP',
      projectId: response.standup.project.id,
      projectName: response.standup.project.name,
      userName: `${response.user.firstName} ${response.user.lastName}`,
      userEmail: response.user.email,
      description: `completed daily standup for ${response.standup.project.name}`,
      timestamp: response.createdAt
    })
  })

  // Add project creation activities
  recentProjects.forEach(project => {
    activities.push({
      id: project.id,
      type: 'PROJECT_CREATED',
      projectId: project.id,
      projectName: project.name,
      userName: `${project.creator.firstName} ${project.creator.lastName}`,
      userEmail: project.creator.email,
      description: `created project "${project.name}"`,
      timestamp: project.createdAt
    })
  })

  // Sort by timestamp and return limited results
  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit)
}

// Organization stats queries
export const getOrganizationStatsQuery = async (userId: string): Promise<OrganizationStats> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true }
  })

  if (!user) {
    throw new Error('User not found')
  }

  const [
    totalMembers,
    totalProjects,
    activeProjects,
    projectsWithTargets,
    projectsWithTasks,
    recentStandups
  ] = await Promise.all([
    // Total members
    prisma.user.count({
      where: { organizationId: user.organizationId, isActive: true }
    }),

    // Total projects
    prisma.project.count({
      where: { organizationId: user.organizationId }
    }),

    // Active projects
    prisma.project.count({
      where: { organizationId: user.organizationId, status: 'ACTIVE' }
    }),

    // Projects with targets for calculations
    prisma.project.findMany({
      where: { organizationId: user.organizationId },
      include: {
        targets: {
          include: {
            tasks: {
              select: { completedAt: true }
            }
          }
        }
      }
    }),

    // For task calculations (duplicate of above, could be optimized)
    prisma.project.findMany({
      where: { organizationId: user.organizationId },
      include: {
        targets: {
          include: {
            tasks: {
              select: { completedAt: true }
            }
          }
        }
      }
    }),

    // Recent standups for completion rate
    prisma.standup.findMany({
      where: {
        organizationId: user.organizationId,
        date: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      include: {
        responses: true
      }
    })
  ])

  // Calculate target and task statistics
  const totalTargets = projectsWithTargets.reduce((sum, project) => sum + project.targets.length, 0)
  const completedTargets = projectsWithTargets.reduce(
    (sum, project) => sum + project.targets.filter(t => t.status === 'COMPLETED').length,
    0
  )

  const totalTasks = projectsWithTasks.reduce(
    (sum, project) => sum + project.targets.reduce((tSum, target) => tSum + target.tasks.length, 0),
    0
  )
  const completedTasks = projectsWithTasks.reduce(
    (sum, project) => sum + project.targets.reduce(
      (tSum, target) => tSum + target.tasks.filter(task => task.completedAt !== null).length,
      0
    ),
    0
  )

  // Calculate standup completion rate
  const expectedStandups = recentStandups.length * totalMembers
  const actualStandups = recentStandups.reduce((sum, standup) => sum + standup.responses.length, 0)
  const standupCompletionRate = expectedStandups > 0 ? actualStandups / expectedStandups : 0

  // Calculate average project completion
  const projectCompletions = projectsWithTargets.map(project => {
    if (project.targets.length === 0) return 0
    return project.targets.filter(t => t.status === 'COMPLETED').length / project.targets.length
  })
  const averageProjectCompletion = projectCompletions.length > 0 
    ? projectCompletions.reduce((sum, completion) => sum + completion, 0) / projectCompletions.length
    : 0

  return {
    totalProjects,
    activeProjects,
    totalMembers,
    totalTargets,
    completedTargets,
    totalTasks,
    completedTasks,
    standupCompletionRate: Math.round(standupCompletionRate * 100),
    averageProjectCompletion: Math.round(averageProjectCompletion * 100)
  }
}

// Deadline queries
export const getUpcomingDeadlinesQuery = async (userId: string, days: number = 7): Promise<DeadlineItem[]> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true }
  })

  if (!user) return []

  const upcomingDate = new Date()
  upcomingDate.setDate(upcomingDate.getDate() + days)

  const tasksWithDeadlines = await prisma.task.findMany({
    where: {
      target: {
        project: {
          organizationId: user.organizationId
        }
      },
      dueDate: {
        lte: upcomingDate,
        gte: new Date()
      },
      completedAt: null
    },
    include: {
      assignee: {
        select: { id: true, firstName: true, lastName: true }
      },
      target: {
        include: {
          project: {
            select: { id: true, name: true }
          }
        }
      }
    },
    orderBy: { dueDate: 'asc' }
  })

  return tasksWithDeadlines.map(task => ({
    id: task.id,
    title: task.title,
    type: 'TASK' as const,
    projectId: task.target.project.id,
    projectName: task.target.project.name,
    dueDate: task.dueDate!,
    status: task.completedAt ? 'COMPLETED' : 'IN_PROGRESS',
    priority: task.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    assigneeId: task.assignee?.id,
    assigneeName: task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : undefined
  }))
}

// Standup queries
export const getTodaysStandupQuery = async (userId: string, projectId?: string) => {
  const today = new Date().toISOString().split('T')[0]
  
  const whereClause: any = {
    date: new Date(today),
    organizationId: (await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true }
    }))?.organizationId
  }

  if (projectId) {
    whereClause.projectId = projectId
  }

  return prisma.standup.findFirst({
    where: whereClause,
    include: {
      template: true,
      responses: {
        where: { userId },
        select: { id: true, responses: true, submittedAt: true }
      },
      project: {
        select: { id: true, name: true }
      }
    }
  })
}

export const getUserStandupHistoryQuery = async (userId: string, limit: number = 10) => {
  return prisma.standupResponse.findMany({
    where: { userId },
    include: {
      standup: {
        include: {
          project: {
            select: { id: true, name: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  })
}