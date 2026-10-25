export type UserRole = "USER" | "ADMIN" | "ROLE_ADMIN" | "SUPER_ADMIN" | string

export interface UserMe {
  id: string
  username: string
  email: string
  displayName: string
  role: UserRole
  roles?: string[]
  effectivePermissions?: string[]
  avatarUrl?: string
  emailVerified?: boolean
  verified?: boolean
  verifiedUntil?: string
  createdAt?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface FacebookLoginPayload {
  code?: string
  redirectUri?: string
  accessToken?: string
}

export interface RegisterPayload {
  username: string
  email: string
  password: string
  displayName?: string
}

export interface TwoFaPayload {
  tempToken: string
  totpCode?: string
  backupCode?: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  token: string
  newPassword: string
}

export interface LoginResponse {
  accessToken?: string
  refreshToken?: string
  tokenType?: string
  expiresIn?: number
  user?: UserMe
  requiresTwoFa?: boolean
  tempToken?: string
  message?: string
}

export interface RegisterResponse {
  accessToken?: string
  refreshToken?: string
  tokenType?: string
  expiresIn?: number
  user?: UserMe
  message?: string
}

// Backward compatibility
export type AuthResponse = LoginResponse
export type UserDto = UserMe
