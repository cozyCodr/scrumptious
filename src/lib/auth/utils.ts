import { SignJWT, jwtVerify } from 'jose'

// Password utilities using Web Crypto API
export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const passwordData = encoder.encode(password)
  
  // Combine password and salt
  const combined = new Uint8Array(passwordData.length + salt.length)
  combined.set(passwordData)
  combined.set(salt, passwordData.length)
  
  // Hash using SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined)
  const hashArray = new Uint8Array(hashBuffer)
  
  // Convert to hex strings
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
  const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('')
  
  return `${saltHex}:${hashHex}`
}

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  const [saltHex, hashHex] = hashedPassword.split(':')
  
  // Convert hex back to Uint8Array
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))
  const originalHash = new Uint8Array(hashHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))
  
  // Hash the provided password with the same salt
  const encoder = new TextEncoder()
  const passwordData = encoder.encode(password)
  const combined = new Uint8Array(passwordData.length + salt.length)
  combined.set(passwordData)
  combined.set(salt, passwordData.length)
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined)
  const hashArray = new Uint8Array(hashBuffer)
  
  // Compare hashes
  return hashArray.length === originalHash.length && 
         hashArray.every((byte, index) => byte === originalHash[index])
}

// JWT utilities
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key')

export interface JWTPayload {
  userId: string
  email: string
  role: string
  organizationId: string
  [key: string]: any // Index signature to match jose's JWTPayload type
}

export const createJWT = async (payload: JWTPayload): Promise<string> => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET)
}

export const verifyJWT = async (token: string): Promise<JWTPayload | null> => {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as JWTPayload
  } catch {
    return null
  }
}

// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  // Relaxed validation - only require minimum length for now
  // Can add more requirements later based on security needs
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}

export const validateName = (name: string): boolean => {
  return name.trim().length >= 2 && name.trim().length <= 50
}