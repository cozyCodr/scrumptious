// Main dashboard exports - clean interface for components to import from

// Action exports
export {
  getDashboardDataAction,
  getUserProjectsAction,
  getRecentActivityAction,
  getOrganizationStatsAction,
  createProjectAction,
  updateProjectAction,
  archiveProjectAction,
  getTodaysStandupAction,
  submitQuickStandupAction,
  getStandupHistoryAction,
  requireDashboardAuth,
  redirectToProject,
} from './actions'

// Utility exports
export {
  calculateProjectHealth,
  getProjectProgress,
  isProjectStale,
  formatActivityDescription,
  getActivityIcon,
  groupActivitiesByDate,
  getAvailableQuickActions,
  getRelativeTime,
  formatDateRange,
  validateProjectName,
  validateVision,
  getOptimalGridLayout,
  prioritizeProjects,
} from './utils'

// Type exports
export type {
  DashboardData,
  UserContext,
  ProjectSummary,
  ActivityItem,
  OrganizationStats,
  QuickAction,
  DeadlineItem,
  UserPreferences,
  CreateProjectFormData,
  QuickStandupFormData,
  UpdateProjectFormData,
  DashboardActionResponse,
  ProjectActionResponse,
  StandupActionResponse,
} from './types'

// Query exports (for advanced usage)
export {
  getUserProjectsQuery,
  getRecentActivityQuery,
  getOrganizationStatsQuery,
  getUpcomingDeadlinesQuery,
  getTodaysStandupQuery,
  getUserStandupHistoryQuery,
} from './queries'