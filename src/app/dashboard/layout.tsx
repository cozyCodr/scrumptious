import { redirect } from 'next/navigation'
import { getDashboardDataAction } from '@/lib/dashboard'
import Sidebar from '../components/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get dashboard data for sidebar
  const dashboardData = await getDashboardDataAction()
  
  if (!dashboardData) {
    redirect('/login')
  }

  const { projects } = dashboardData

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar projects={projects} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  )
}