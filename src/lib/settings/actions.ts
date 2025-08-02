'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth/utils'
import { prisma } from '@/lib/prisma'
import { UserRole, InvitationStatus } from '@prisma/client'

/**
 * Verify JWT token and get user
 */
async function verifyToken() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) {
    return null
  }

  const payload = await verifyJWT(token)
  if (!payload) {
    return null
  }

  // Get fresh user data from database
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { organization: true },
  })

  if (!user || !user.isActive) {
    return null
  }

  return user
}

export interface SettingsActionResponse {
  success: boolean
  error?: string
  data?: any
}

export interface InviteMemberData {
  email: string
  role: UserRole
}

export interface UpdateMemberData {
  userId: string
  role: UserRole
}

/**
 * Get organization settings and members
 */
export async function getOrganizationSettingsAction() {
  try {
    const user = await verifyToken()
    if (!user) {
      return null
    }

    // Get organization with members and invitations
    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      include: {
        users: {
          where: { isActive: true },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            createdAt: true,
            lastLoginAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        invitations: {
          where: { status: InvitationStatus.PENDING },
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
            expiresAt: true,
            invitedBy: {
              select: { firstName: true, lastName: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!organization) {
      return null
    }

    return {
      organization: {
        id: organization.id,
        name: organization.name,
        domain: organization.domain,
        memberCount: organization.users.length
      },
      members: organization.users.map(member => ({
        id: member.id,
        name: `${member.firstName} ${member.lastName}`,
        email: member.email,
        role: member.role,
        joinedAt: member.createdAt,
        lastLoginAt: member.lastLoginAt,
        isCurrentUser: member.id === user.id
      })),
      invitations: organization.invitations.map(invitation => ({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        createdAt: invitation.createdAt,
        expiresAt: invitation.expiresAt,
        invitedBy: invitation.invitedBy ? `${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}` : 'Unknown'
      })),
      currentUser: {
        id: user.id,
        role: user.role,
        isOwner: user.role === UserRole.OWNER
      }
    }
  } catch (error) {
    console.error('Get organization settings error:', error)
    return null
  }
}

/**
 * Invite a new member to the organization
 */
export async function inviteMemberAction(data: InviteMemberData): Promise<SettingsActionResponse> {
  try {
    const user = await verifyToken()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    // Check if user has permission to invite members
    if (user.role !== UserRole.OWNER && user.role !== UserRole.ADMIN) {
      return { success: false, error: 'Only owners and admins can invite members' }
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      return { success: false, error: 'Please provide a valid email address' }
    }

    // Check if user already exists in organization
    const existingUser = await prisma.user.findFirst({
      where: {
        email: data.email.toLowerCase(),
        organizationId: user.organizationId,
        isActive: true
      }
    })

    if (existingUser) {
      return { success: false, error: 'This user is already a member of your organization' }
    }

    // Check if there's already a pending invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email: data.email.toLowerCase(),
        organizationId: user.organizationId,
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() }
      }
    })

    if (existingInvitation) {
      return { success: false, error: 'An invitation has already been sent to this email address' }
    }

    // Generate invitation token
    const token = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        email: data.email.toLowerCase(),
        role: data.role,
        token,
        organizationId: user.organizationId,
        invitedById: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    })

    // TODO: Send email invitation
    console.log(`Invitation sent to ${data.email} with token: ${token}`)

    revalidatePath('/dashboard/settings')
    return { 
      success: true, 
      data: { 
        invitationId: invitation.id,
        message: `Invitation sent to ${data.email}` 
      } 
    }
  } catch (error) {
    console.error('Invite member error:', error)
    return { success: false, error: 'Failed to send invitation' }
  }
}

/**
 * Update member role
 */
export async function updateMemberRoleAction(data: UpdateMemberData): Promise<SettingsActionResponse> {
  try {
    const user = await verifyToken()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    // Check if user has permission to update roles
    if (user.role !== UserRole.OWNER && user.role !== UserRole.ADMIN) {
      return { success: false, error: 'Only owners and admins can update member roles' }
    }

    // Can't update your own role
    if (data.userId === user.id) {
      return { success: false, error: 'You cannot change your own role' }
    }

    // Get the target user
    const targetUser = await prisma.user.findFirst({
      where: {
        id: data.userId,
        organizationId: user.organizationId,
        isActive: true
      }
    })

    if (!targetUser) {
      return { success: false, error: 'User not found' }
    }

    // Only owners can promote users to admin or demote other owners
    if (user.role === UserRole.ADMIN) {
      if (data.role === UserRole.OWNER || targetUser.role === UserRole.OWNER) {
        return { success: false, error: 'Only organization owners can manage owner roles' }
      }
    }

    // Update user role
    await prisma.user.update({
      where: { id: data.userId },
      data: { role: data.role }
    })

    revalidatePath('/dashboard/settings')
    return { success: true, data: { message: 'Member role updated successfully' } }
  } catch (error) {
    console.error('Update member role error:', error)
    return { success: false, error: 'Failed to update member role' }
  }
}

/**
 * Remove member from organization
 */
export async function removeMemberAction(userId: string): Promise<SettingsActionResponse> {
  try {
    const user = await verifyToken()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    // Check if user has permission to remove members
    if (user.role !== UserRole.OWNER && user.role !== UserRole.ADMIN) {
      return { success: false, error: 'Only owners and admins can remove members' }
    }

    // Can't remove yourself
    if (userId === user.id) {
      return { success: false, error: 'You cannot remove yourself from the organization' }
    }

    // Get the target user
    const targetUser = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId: user.organizationId,
        isActive: true
      }
    })

    if (!targetUser) {
      return { success: false, error: 'User not found' }
    }

    // Only owners can remove other owners
    if (user.role === UserRole.ADMIN && targetUser.role === UserRole.OWNER) {
      return { success: false, error: 'Only organization owners can remove other owners' }
    }

    // Deactivate user instead of deleting (to preserve data integrity)
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false }
    })

    revalidatePath('/dashboard/settings')
    return { success: true, data: { message: 'Member removed successfully' } }
  } catch (error) {
    console.error('Remove member error:', error)
    return { success: false, error: 'Failed to remove member' }
  }
}

/**
 * Cancel pending invitation
 */
export async function cancelInvitationAction(invitationId: string): Promise<SettingsActionResponse> {
  try {
    const user = await verifyToken()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    // Check if user has permission to cancel invitations
    if (user.role !== UserRole.OWNER && user.role !== UserRole.ADMIN) {
      return { success: false, error: 'Only owners and admins can cancel invitations' }
    }

    // Update invitation status
    const invitation = await prisma.invitation.updateMany({
      where: {
        id: invitationId,
        organizationId: user.organizationId,
        status: InvitationStatus.PENDING
      },
      data: {
        status: InvitationStatus.EXPIRED
      }
    })

    if (invitation.count === 0) {
      return { success: false, error: 'Invitation not found or already processed' }
    }

    revalidatePath('/dashboard/settings')
    return { success: true, data: { message: 'Invitation cancelled successfully' } }
  } catch (error) {
    console.error('Cancel invitation error:', error)
    return { success: false, error: 'Failed to cancel invitation' }
  }
}