// Dashboard-specific types and interfaces

export interface DashboardData {
  user: UserContext
  projects: ProjectSummary[]
  recentActivity: ActivityItem[]
  organizationStats: OrganizationStats
  quickActions: QuickAction[]
  upcomingDeadlines: DeadlineItem[]
}

export interface UserContext {
  id: string
  name: string
  email: string
  role: string
  organization: {
    id: string
    name: string
    memberCount: number
  }
  preferences?: UserPreferences
}

export interface ProjectSummary {
  id: string
  name: string
  vision: string
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
  targetCount: number
  completedTargets: number
  taskCount: number
  completedTasks: number
  lastActivity: Date
  memberCount: number
  isOwner: boolean
}

export interface ActivityItem {
  id: string
  type: 'STANDUP' | 'PROJECT_CREATED' | 'TARGET_COMPLETED' | 'TASK_ASSIGNED'
  projectId?: string
  projectName?: string
  userName: string
  userEmail: string
  description: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface OrganizationStats {
  totalProjects: number
  activeProjects: number
  totalMembers: number
  totalTargets: number
  completedTargets: number
  totalTasks: number
  completedTasks: number
  standupCompletionRate: number // Last 7 days
  averageProjectCompletion: number
}

export interface QuickAction {
  id: string
  label: string
  description: string
  icon: string
  action: 'CREATE_PROJECT' | 'START_STANDUP' | 'CREATE_TARGET' | 'INVITE_MEMBER'
  available: boolean
  requiredRole?: string[]
}

export interface DeadlineItem {
  id: string
  title: string
  type: 'TARGET' | 'TASK'
  projectId: string
  projectName: string
  dueDate: Date
  status: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  assigneeId?: string
  assigneeName?: string
}

export interface UserPreferences {
  dashboardLayout: 'compact' | 'detailed'
  defaultView: 'projects' | 'activity' | 'stats'
  notifications: {
    standupReminders: boolean
    taskDeadlines: boolean
    projectUpdates: boolean
  }
}

// Form data types
export interface CreateProjectFormData {
  name: string
  vision: string
  description?: string
}

export interface QuickStandupFormData {
  projectId: string
  responses: Array<{
    questionId: string
    value: any
    type: string
  }>
}

export interface UpdateProjectFormData {
  id: string
  name?: string
  vision?: string
  description?: string
  status?: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
}

// Response types
export interface DashboardActionResponse {
  success: boolean
  error?: string
  data?: any
}

export interface ProjectActionResponse extends DashboardActionResponse {
  project?: ProjectSummary
}

export interface StandupActionResponse extends DashboardActionResponse {
  standup?: {
    id: string
    date: string
    projectId: string
    submitted: boolean
  }
}