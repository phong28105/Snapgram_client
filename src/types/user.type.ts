export interface UserProfileResponse {
  id: string
  username: string
  displayName?: string
  avatarUrl?: string
  privateAccount?: boolean
  verified?: boolean
  verifiedUntil?: string
  createdAt?: string
  bio?: string
  website?: string
  pronouns?: string
  category?: string
  lastSeenAt?: string
  email?: string
  emailVerified?: boolean
  twoFaEnabled?: boolean
  showActivityStatus?: boolean
}

export interface UpdateProfileRequest {
  displayName?: string
  avatarUrl?: string
  bio?: string
  website?: string
  pronouns?: string
  category?: string
}

export interface ActivityStatusRequest {
  showActivityStatus: boolean
}

export interface PrivacySettingRequest {
  privateAccount: boolean
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface ChangeEmailRequest {
  newEmail: string
  currentPassword: string
}

export interface NoteRequest {
  content: string
}

export interface NoteResponse {
  id: string
  content: string
  createdAt: string
  expiresAt: string
}

export interface BlockedUserResponse {
  userId: string
  username: string
  displayName?: string
  avatarUrl?: string
  blockedAt: string
}

export interface PageBlockedUserResponse {
  content: BlockedUserResponse[]
  totalPages: number
  totalElements: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface PageUserProfileResponse {
  content: UserProfileResponse[]
  totalPages: number
  totalElements: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface TwoFaSetupResponse {
  secret: string
  otpAuthUrl: string
  qrCodeBase64: string
}

export interface TwoFaEnableRequest {
  totpCode: string
}

export interface TwoFaEnableResponse {
  backupCodes: string[]
  message?: string
}

export interface TwoFaDisableRequest {
  totpCode?: string
  backupCode?: string
}
