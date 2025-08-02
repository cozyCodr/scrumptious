// Dashboard utility functions
import { ProjectSummary, ActivityItem, QuickAction, UserContext } from './types'

// Project utilities
export const calculateProjectHealth = (project: ProjectSummary): 'excellent' | 'good' | 'warning' | 'critical' => {
  const targetCompletion = project.targetCount > 0 ? project.completedTargets / project.targetCount : 0
  const taskCompletion = project.taskCount > 0 ? project.completedTasks / project.taskCount : 0
  const overallCompletion = (targetCompletion + taskCompletion) / 2

  if (overallCompletion >= 0.8) return 'excellent'
  if (overallCompletion >= 0.6) return 'good'
  if (overallCompletion >= 0.3) return 'warning'
  return 'critical'
}

export const getProjectProgress = (project: ProjectSummary): number => {
  if (project.targetCount === 0) return 0
  return Math.round((project.completedTargets / project.targetCount) * 100)
}

export const isProjectStale = (project: ProjectSummary): boolean => {
  const daysSinceActivity = Math.floor(
    (Date.now() - project.lastActivity.getTime()) / (1000 * 60 * 60 * 24)
  )
  return daysSinceActivity > 7 // No activity in 7 days
}

// Activity utilities
export const formatActivityDescription = (activity: ActivityItem): string => {
  switch (activity.type) {
    case 'STANDUP':
      return `completed daily standup${activity.projectName ? ` for ${activity.projectName}` : ''}`
    case 'PROJECT_CREATED':
      return `created project "${activity.projectName}"`
    case 'TARGET_COMPLETED':
      return `completed target in ${activity.projectName}`
    case 'TASK_ASSIGNED':
      return `was assigned a task in ${activity.projectName}`
    default:
      return activity.description
  }
}

export const getActivityIcon = (activityType: ActivityItem['type']): string => {
  switch (activityType) {
    case 'STANDUP':
      return '💬'
    case 'PROJECT_CREATED':
      return '🚀'
    case 'TARGET_COMPLETED':
      return '🎯'
    case 'TASK_ASSIGNED':
      return '✅'
    default:
      return '📝'
  }
}

export const groupActivitiesByDate = (activities: ActivityItem[]): Record<string, ActivityItem[]> => {
  return activities.reduce((groups, activity) => {
    const date = activity.timestamp.toISOString().split('T')[0]
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(activity)
    return groups
  }, {} as Record<string, ActivityItem[]>)
}

// Quick actions utilities
export const getAvailableQuickActions = (userContext: UserContext): QuickAction[] => {
  const baseActions: QuickAction[] = [
    {
      id: 'create_project',
      label: 'New Project',
      description: 'Start a new project with vision and targets',
      icon: '🚀',
      action: 'CREATE_PROJECT',
      available: true
    },
    {
      id: 'start_standup',
      label: 'Daily Standup',
      description: 'Submit your daily standup update',
      icon: '💬',
      action: 'START_STANDUP',
      available: true
    }
  ]

  // Add role-specific actions
  if (userContext.role === 'OWNER' || userContext.role === 'ADMIN') {
    baseActions.push({
      id: 'invite_member',
      label: 'Invite Member',
      description: 'Invite someone to your organization',
      icon: '👥',
      action: 'INVITE_MEMBER',
      available: true,
      requiredRole: ['OWNER', 'ADMIN']
    })
  }

  return baseActions.filter(action => 
    !action.requiredRole || action.requiredRole.includes(userContext.role)
  )
}

// Time utilities
export const getRelativeTime = (date: Date): string => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return date.toLocaleDateString()
}

export const formatDateRange = (startDate: Date, endDate: Date): string => {
  const start = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const end = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${start} - ${end}`
}

// Validation utilities
export const validateProjectName = (name: string): { isValid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Project name is required' }
  }
  if (name.trim().length < 2) {
    return { isValid: false, error: 'Project name must be at least 2 characters' }
  }
  if (name.trim().length > 100) {
    return { isValid: false, error: 'Project name must be less than 100 characters' }
  }
  return { isValid: true }
}

export const validateVision = (vision: string): { isValid: boolean; error?: string } => {
  if (!vision || vision.trim().length === 0) {
    return { isValid: false, error: 'Project vision is required' }
  }
  if (vision.trim().length < 10) {
    return { isValid: false, error: 'Vision should be at least 10 characters to be meaningful' }
  }
  if (vision.trim().length > 500) {
    return { isValid: false, error: 'Vision must be less than 500 characters' }
  }
  return { isValid: true }
}

// Dashboard layout utilities
export const getOptimalGridLayout = (itemCount: number): { cols: number; rows: number } => {
  if (itemCount <= 2) return { cols: 1, rows: itemCount }
  if (itemCount <= 4) return { cols: 2, rows: 2 }
  if (itemCount <= 6) return { cols: 3, rows: 2 }
  return { cols: 3, rows: Math.ceil(itemCount / 3) }
}

export const prioritizeProjects = (projects: ProjectSummary[]): ProjectSummary[] => {
  return projects.sort((a, b) => {
    // Active projects first
    if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1
    if (b.status === 'ACTIVE' && a.status !== 'ACTIVE') return 1
    
    // Owner projects first
    if (a.isOwner && !b.isOwner) return -1
    if (b.isOwner && !a.isOwner) return 1
    
    // Most recent activity first
    return b.lastActivity.getTime() - a.lastActivity.getTime()
  })
}