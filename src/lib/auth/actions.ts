'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import {
  hashPassword,
  verifyPassword,
  createJWT,
  validateEmail,
  validatePassword,
  validateName,
  JWTPayload,
} from './utils'
import {
  getSessionUser,
  setAuthCookie,
  clearAuthCookie,
} from './server-utils'

// Types for form data
export interface LoginFormData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface SignupFormData {
  firstName: string
  lastName: string
  email: string
  organizationName: string
  password: string
  confirmPassword: string
  agreeToTerms?: boolean
}

export interface ForgotPasswordFormData {
  email: string
}

// Response types
export interface AuthResponse {
  success: boolean
  error?: string
  errors?: Record<string, string[]>
}

// Login action
export async function loginAction(formData: LoginFormData): Promise<AuthResponse> {
  try {
    const { email, password } = formData

    // Validation
    if (!validateEmail(email)) {
      return {
        success: false,
        error: 'Please enter a valid email address',
      }
    }

    if (!password || password.length < 1) {
      return {
        success: false,
        error: 'Password is required',
      }
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { organization: true },
    })

    if (!user) {
      return {
        success: false,
        error: 'Invalid email or password',
      }
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return {
        success: false,
        error: 'Invalid email or password',
      }
    }

    // Check if user is active
    if (!user.isActive) {
      return {
        success: false,
        error: 'Your account has been deactivated. Please contact your administrator.',
      }
    }

    // Create JWT token
    const jwtPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    }
    const token = await createJWT(jwtPayload)
    await setAuthCookie(token)

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    return { success: true }
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}

// Signup action
export async function signupAction(formData: SignupFormData): Promise<AuthResponse> {
  try {
    const {
      firstName,
      lastName,
      email,
      organizationName,
      password,
      confirmPassword,
    } = formData

    // Validation
    const errors: Record<string, string[]> = {}

    if (!validateName(firstName)) {
      errors.firstName = ['First name must be between 2 and 50 characters']
    }

    if (!validateName(lastName)) {
      errors.lastName = ['Last name must be between 2 and 50 characters']
    }

    if (!validateEmail(email)) {
      errors.email = ['Please enter a valid email address']
    }

    if (!validateName(organizationName)) {
      errors.organizationName = ['Organization name must be between 2 and 50 characters']
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = ['Passwords do not match']
    }

    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        errors,
      }
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return {
        success: false,
        errors: {
          email: ['An account with this email already exists'],
        },
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create organization and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // For now, always create a new organization per signup
      // This can be enhanced later with domain-based organization joining
      const organization = await tx.organization.create({
        data: {
          name: organizationName.trim(),
          domain: null, // Don't set domain to avoid unique constraint issues
          settings: {
            timezone: 'UTC',
            workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            standupReminders: true,
          },
        },
      })

      // Create user as owner of the new organization
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          password: hashedPassword,
          role: 'OWNER',
          organizationId: organization.id,
        },
      })

      return { user, organization }
    })

    // Create JWT token
    const jwtPayload: JWTPayload = {
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      organizationId: result.user.organizationId,
    }
    const token = await createJWT(jwtPayload)
    await setAuthCookie(token)

    return { success: true }
  } catch (error) {
    console.error('Signup error:', error)
    
    // Provide more specific error messages for common issues
    if (error instanceof Error) {
      if (error.message.includes('E11000') && error.message.includes('email')) {
        return {
          success: false,
          errors: {
            email: ['An account with this email already exists'],
          },
        }
      }
      
      if (error.message.includes('validation')) {
        return {
          success: false,
          error: 'Please check your input and try again.',
        }
      }
    }
    
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}

// Logout action
export async function logoutAction(): Promise<void> {
  try {
    await clearAuthCookie()
  } catch (error) {
    console.error('Logout error:', error)
  }
  
  redirect('/login')
}

// Get current user action
export async function getCurrentUser() {
  try {
    return await getSessionUser()
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

// Require authentication (redirect if not authenticated)
export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  return user
}

// Forgot password action (simplified - in production you'd send an email)
export async function forgotPasswordAction(
  formData: ForgotPasswordFormData
): Promise<AuthResponse> {
  try {
    const { email } = formData

    if (!validateEmail(email)) {
      return {
        success: false,
        error: 'Please enter a valid email address',
      }
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Always return success for security (don't reveal if email exists)
    // In production, you would:
    // 1. Generate a reset token
    // 2. Store it in database with expiration
    // 3. Send reset email
    
    console.log(`Password reset requested for: ${email}`)
    if (user) {
      console.log(`User found: ${user.firstName} ${user.lastName}`)
      // TODO: Send password reset email
    }

    return { success: true }
  } catch (error) {
    console.error('Forgot password error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}