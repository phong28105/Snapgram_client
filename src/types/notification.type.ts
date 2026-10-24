export type NotificationType =
  | "LIKE"
  | "COMMENT"
  | "POST_CREATED"
  | "STORY_CREATED"
  | "FOLLOW"
  | "MENTION"
  | "MESSAGE"
  | "REPORT_RESOLVED"
  | "MISSED_CALL"
  | "SYSTEM"

export interface NotificationResponse {
  id: string
  userId: string
  type: NotificationType
  actorId?: string
  targetType?: string
  targetId?: string
  payload?: string | Record<string, any>
  isRead: boolean
  createdAt: string
  actorUsername?: string
  actorDisplayName?: string
  actorAvatarUrl?: string
}

export interface PageNotificationResponse {
  content?: NotificationResponse[]
  totalElements?: number
  totalPages?: number
  number?: number
  size?: number
  last?: boolean
}
