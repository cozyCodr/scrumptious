'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  inviteMemberAction,
  updateMemberRoleAction,
  removeMemberAction,
  cancelInvitationAction
} from '@/lib/settings/actions'
import { UserRole } from '../../../../prisma/generated/client'

interface Member {
  id: string
  name: string
  email: string
  role: UserRole
  joinedAt: Date
  lastLoginAt: Date | null
  isCurrentUser: boolean
}

interface Invitation {
  id: string
  email: string
  role: UserRole
  createdAt: Date
  expiresAt: Date
  invitedBy: string
}

interface SettingsData {
  organization: {
    id: string
    name: string
    domain: string | null
    memberCount: number
  }
  members: Member[]
  invitations: Invitation[]
  currentUser: {
    id: string
    role: UserRole
    isOwner: boolean
  }
}

interface SettingsClientProps {
  initialData: SettingsData
}

export default function SettingsClient({ initialData }: SettingsClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'organization' | 'members'>('members')
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.MEMBER)
  const [isLoading, setIsLoading] = useState(false)

  const canManageMembers = initialData.currentUser.role === UserRole.OWNER || initialData.currentUser.role === UserRole.ADMIN

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManageMembers) return

    setIsLoading(true)
    try {
      const result = await inviteMemberAction({
        email: inviteEmail,
        role: inviteRole
      })

      if (result.success) {
        setInviteEmail('')
        setInviteRole(UserRole.MEMBER)
        setShowInviteForm(false)
        router.refresh()
      } else {
        alert(result.error || 'Failed to send invitation')
      }
    } catch (error) {
      alert('An error occurred while sending the invitation')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    if (!canManageMembers) return

    setIsLoading(true)
    try {
      const result = await updateMemberRoleAction({
        userId,
        role: newRole
      })

      if (result.success) {
        router.refresh()
      } else {
        alert(result.error || 'Failed to update member role')
      }
    } catch (error) {
      alert('An error occurred while updating the member role')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!canManageMembers) return

    if (!confirm(`Are you sure you want to remove ${memberName} from the organization?`)) {
      return
    }

    setIsLoading(true)
    try {
      const result = await removeMemberAction(userId)

      if (result.success) {
        router.refresh()
      } else {
        alert(result.error || 'Failed to remove member')
      }
    } catch (error) {
      alert('An error occurred while removing the member')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelInvitation = async (invitationId: string, email: string) => {
    if (!canManageMembers) return

    if (!confirm(`Are you sure you want to cancel the invitation to ${email}?`)) {
      return
    }

    setIsLoading(true)
    try {
      const result = await cancelInvitationAction(invitationId)

      if (result.success) {
        router.refresh()
      } else {
        alert(result.error || 'Failed to cancel invitation')
      }
    } catch (error) {
      alert('An error occurred while cancelling the invitation')
    } finally {
      setIsLoading(false)
    }
  }

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.OWNER: return 'bg-purple-100 text-purple-800'
      case UserRole.ADMIN: return 'bg-blue-100 text-blue-800'
      case UserRole.MEMBER: return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.OWNER: return 'Owner'
      case UserRole.ADMIN: return 'Admin'
      case UserRole.MEMBER: return 'Member'
      default: return 'Member'
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="hover:text-slate-800 font-medium transition-colors duration-200">
            {initialData.organization.name}
          </span>
          <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-slate-800 font-medium">Settings</span>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white px-8 py-6 border-b border-gray-200">
          <h1 className="text-2xl font-medium text-slate-800 mb-3 tracking-tight">Settings</h1>
          <p className="text-slate-600 font-medium">Manage your organization and team members</p>
        </div>

        {/* Tabs */}
        <div className="bg-white px-8 py-4 border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('organization')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'organization'
                  ? 'border-slate-800 text-slate-800'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
            >
              Organization
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'members'
                  ? 'border-slate-800 text-slate-800'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
            >
              Members ({initialData.members.length})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'organization' && (
            <div className="w-full max-w-4xl mx-auto space-y-8">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Organization</h2>
                <p className="text-slate-600 mt-1">Manage your organization profile and settings</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-slate-900 block mb-2">
                      Organization Name
                    </label>
                    <div className="text-lg font-medium text-slate-800 py-3 border-b-2 border-slate-200">
                      {initialData.organization.name}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-900 block mb-2">
                      Domain
                    </label>
                    <div className="text-lg font-medium text-slate-800 py-3 border-b-2 border-slate-200">
                      {initialData.organization.domain || 'Not set'}
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-slate-50 rounded-xl">
                  <h3 className="font-semibold text-slate-900 mb-4">Organization Stats</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900">{initialData.members.length}</div>
                      <div className="text-sm text-slate-600">Total Members</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900">{initialData.invitations.length}</div>
                      <div className="text-sm text-slate-600">Pending Invitations</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900">{getRoleLabel(initialData.currentUser.role)}</div>
                      <div className="text-sm text-slate-600">Your Role</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="w-full max-w-6xl mx-auto space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Team Members</h2>
                  <p className="text-slate-600 mt-1">Manage your organization's team members and their roles</p>
                </div>
                {canManageMembers && (
                  <button
                    onClick={() => setShowInviteForm(true)}
                    disabled={isLoading}
                    className="bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Invite Member
                  </button>
                )}
              </div>

              {/* Members Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900">Member</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900">Role</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900">Joined</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900">Last Active</th>
                        {canManageMembers && (
                          <th className="text-right py-4 px-6 text-sm font-semibold text-slate-900">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {initialData.members.map((member) => (
                        <tr key={member.id} className="hover:bg-slate-50 transition-colors duration-200">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center text-sm font-medium text-white shadow-sm">
                                {getUserInitials(member.name)}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900">
                                  {member.name}
                                  {member.isCurrentUser && (
                                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-slate-500">{member.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            {canManageMembers && !member.isCurrentUser ? (
                              <select
                                value={member.role}
                                onChange={(e) => handleUpdateRole(member.id, e.target.value as UserRole)}
                                disabled={isLoading}
                                className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none transition-all duration-200 font-medium"
                              >
                                <option value={UserRole.MEMBER}>Member</option>
                                <option value={UserRole.ADMIN}>Admin</option>
                                {initialData.currentUser.role === UserRole.OWNER && (
                                  <option value={UserRole.OWNER}>Owner</option>
                                )}
                              </select>
                            ) : (
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(member.role)}`}>
                                {getRoleLabel(member.role)}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-sm text-slate-600 font-medium">
                            {new Date(member.joinedAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6 text-sm text-slate-600 font-medium">
                            {member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleDateString() : 'Never'}
                          </td>
                          {canManageMembers && (
                            <td className="py-4 px-6 text-right">
                              {!member.isCurrentUser && (
                                <button
                                  onClick={() => handleRemoveMember(member.id, member.name)}
                                  disabled={isLoading}
                                  className="text-red-600 hover:text-red-700 disabled:text-red-400 text-sm font-semibold transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-red-50"
                                >
                                  Remove
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pending Invitations */}
              {initialData.invitations.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Pending Invitations</h3>
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900">Email</th>
                            <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900">Role</th>
                            <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900">Invited By</th>
                            <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900">Expires</th>
                            {canManageMembers && (
                              <th className="text-right py-4 px-6 text-sm font-semibold text-slate-900">Actions</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {initialData.invitations.map((invitation) => (
                            <tr key={invitation.id} className="hover:bg-slate-50 transition-colors duration-200">
                              <td className="py-4 px-6 font-medium text-slate-900">{invitation.email}</td>
                              <td className="py-4 px-6">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(invitation.role)}`}>
                                  {getRoleLabel(invitation.role)}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-sm text-slate-600">{invitation.invitedBy}</td>
                              <td className="py-4 px-6 text-sm text-slate-600">
                                {new Date(invitation.expiresAt).toLocaleDateString()}
                              </td>
                              {canManageMembers && (
                                <td className="py-4 px-6 text-right">
                                  <button
                                    onClick={() => handleCancelInvitation(invitation.id, invitation.email)}
                                    disabled={isLoading}
                                    className="text-red-600 hover:text-red-700 disabled:text-red-400 text-sm font-semibold transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-red-50"
                                  >
                                    Cancel
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-white/10 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl max-w-md w-full mx-4 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800 tracking-tight">
                Invite Team Member
              </h3>
              <button
                onClick={() => setShowInviteForm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleInviteMember}>
              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  The email address to send the invitation to
                </p>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none bg-slate-50 text-slate-800 placeholder-slate-500 transition-all duration-200 font-medium"
                  placeholder="colleague@company.com"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Role
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  The permissions level for this team member
                </p>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none bg-slate-50 text-slate-800 transition-all duration-200 font-medium"
                >
                  <option value={UserRole.MEMBER}>Member</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                  {initialData.currentUser.role === UserRole.OWNER && (
                    <option value={UserRole.OWNER}>Owner</option>
                  )}
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 shadow-sm disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : 'Send Invitation'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="px-4 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-medium transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}