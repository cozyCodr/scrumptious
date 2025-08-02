import { redirect } from 'next/navigation'
import { getOrganizationSettingsAction } from '@/lib/settings/actions'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const settingsData = await getOrganizationSettingsAction()
  
  if (!settingsData) {
    redirect('/login')
  }

  return <SettingsClient initialData={settingsData} />
}