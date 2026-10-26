export interface SuggestedUser {
  userId: string
  mutualFriendsCount?: number
  reason?: string
}

export interface TrendingTag {
  tag: string
  postCount: number
}
