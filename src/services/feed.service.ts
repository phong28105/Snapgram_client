import { apiClient } from "@/lib/api"
import type { SuggestedUser, TrendingTag } from "@/types/feed.type"

export const feedService = {
  /**
   * GET /api/feed/suggested-users — Lấy danh sách gợi ý kết bạn/theo dõi
   */
  async getSuggestedUsers(limit = 10): Promise<SuggestedUser[]> {
    const res = await apiClient.get<SuggestedUser[]>("/api/feed/suggested-users", {
      params: { limit },
    })
    return res.data
  },

  /**
   * GET /api/feed/trending — Lấy danh sách trending tags
   */
  async getTrendingTags(limit = 10): Promise<TrendingTag[]> {
    const res = await apiClient.get<TrendingTag[]>("/api/feed/trending", {
      params: { limit },
    })
    return res.data
  },
}
