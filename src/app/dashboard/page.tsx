import { getDashboardDataAction } from '@/lib/dashboard'
import { redirect } from 'next/navigation'
import ContentHeader from '../components/ContentHeader'
import ProjectsGrid from '../components/ProjectsGrid'

export default async function DashboardPage() {
  // Get dashboard data for this specific page
  const dashboardData = await getDashboardDataAction()
  
  if (!dashboardData) {
    redirect('/login')
  }

  const { projects } = dashboardData

  return (
    <>
      {/* Content Header */}
      <ContentHeader />

      {/* Projects Grid */}
      <div className="flex-1 p-8 overflow-auto bg-gray-100">
        <ProjectsGrid projects={projects} />
      </div>
    </>
  )
}