'use server'

// Server-only utilities that use next/headers
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { User } from '@prisma/client'
import { verifyJWT, type JWTPayload } from './utils'

export const getSessionUser = async (): Promise<User | null> => {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) return null

  const payload = await verifyJWT(token)
  if (!payload) return null

  // Get fresh user data from database
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { organization: true },
  })

  if (!user || !user.isActive) return null

  return user
}

export const setAuthCookie = async (token: string): Promise<void> => {
  const cookieStore = await cookies()

  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
  })
}

export const clearAuthCookie = async (): Promise<void> => {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
}