import { apiClient } from "@/lib/api";
import type {
  CollectionResponse,
  CommentResponse,
  CreateCollectionRequest,
  CreateCommentRequest,
  CreateHighlightRequest,
  CreatePostRequest,
  CreateReportRequest,
  CreateStoryRequest,
  FollowResponse,
  HashtagResponse,
  HighlightDetailResponse,
  HighlightResponse,
  InteractionRequest,
  PageCommentResponse,
  PageFollowResponse,
  PagePostResponse,
  PageStoryResponse,
  PageStoryViewerResponse,
  PostResponse,
  ReportResponse,
  SavePostRequest,
  StoryResponse,
  UpdatePostRequest,
} from "@/types/content.type";

export const contentService = {
  // ==========================================
  // 1. POSTS API
  // ==========================================

  /**
   * Tạo bài đăng mới
   * POST /api/posts
   */
  async createPost(data: CreatePostRequest): Promise<PostResponse> {
    const response = await apiClient.post<PostResponse>("/api/posts", data);
    return response.data;
  },

  /**
   * Khám phá bài đăng
   * GET /api/posts/explore
   */
  async getExplorePosts(page = 0, size = 20): Promise<PagePostResponse> {
    const response = await apiClient.get<PagePostResponse>("/api/posts/explore", {
      params: { page, size },
    });
    return response.data;
  },

  /**
   * Danh sách Reels công khai (phân trang — dùng cho lazy load)
   * GET /api/posts/reels
   */
  async getReels(page = 0, size = 6): Promise<PagePostResponse> {
    const response = await apiClient.get<PagePostResponse>("/api/posts/reels", {
      params: { page, size },
    });
    return response.data;
  },

  /**
   * Feed cá nhân
   * GET /api/posts/feed
   */
  async getFeedPosts(page = 0, size = 20): Promise<PagePostResponse> {
    const response = await apiClient.get<PagePostResponse>("/api/posts/feed", {
      params: { page, size },
    });
    return response.data;
  },

  /**
   * Bài đăng của tôi
   * GET /api/posts/me
   */
  async getMyPosts(page = 0, size = 20): Promise<PagePostResponse> {
    const response = await apiClient.get<PagePostResponse>("/api/posts/me", {
      params: { page, size },
    });
    return response.data;
  },

  /**
   * Bài đăng của user khác
   * GET /api/posts/user/{userId}
   */
  async getUserPosts(userId: string, page = 0, size = 20): Promise<PagePostResponse> {
    const response = await apiClient.get<PagePostResponse>(
      `/api/posts/user/${encodeURIComponent(userId)}`,
      { params: { page, size } }
    );
    return response.data;
  },

  /**
   * Lấy chi tiết bài đăng
   * GET /api/posts/{id}
   */
  async getPost(id: string): Promise<PostResponse> {
    const response = await apiClient.get<PostResponse>(
      `/api/posts/${encodeURIComponent(id)}`
    );
    return response.data;
  },

  /**
   * Sửa bài đăng
   * PUT /api/posts/{id}
   */
  async updatePost(id: string, data: UpdatePostRequest): Promise<PostResponse> {
    const response = await apiClient.put<PostResponse>(
      `/api/posts/${encodeURIComponent(id)}`,
      data
    );
    return response.data;
  },

  /**
   * Xóa bài đăng
   * DELETE /api/posts/{id}
   */
  async deletePost(id: string): Promise<void> {
    await apiClient.delete(`/api/posts/${encodeURIComponent(id)}`);
  },

  // ==========================================
  // 2. INTERACTIONS API
  // ==========================================

  /**
   * Ghi nhận tương tác (LIKE / VIEW / SHARE / SAVE / SKIP)
   * POST /api/posts/{postId}/interact
   */
  async interactPost(postId: string, data: InteractionRequest): Promise<void> {
    await apiClient.post(
      `/api/posts/${encodeURIComponent(postId)}/interact`,
      data
    );
  },

  /**
   * Bỏ like bài đăng
   * DELETE /api/posts/{postId}/interact/like
   */
  async unlikePost(postId: string): Promise<void> {
    await apiClient.delete(
      `/api/posts/${encodeURIComponent(postId)}/interact/like`
    );
  },

  // ==========================================
  // 3. COMMENTS API
  // ==========================================

  /**
   * Lấy danh sách bình luận gốc
   * GET /api/posts/{postId}/comments
   */
  async getRootComments(
    postId: string,
    page = 0,
    size = 20
  ): Promise<PageCommentResponse> {
    const response = await apiClient.get<PageCommentResponse>(
      `/api/posts/${encodeURIComponent(postId)}/comments`,
      { params: { page, size } }
    );
    return response.data;
  },

  /**
   * Tạo bình luận / reply
   * POST /api/posts/{postId}/comments
   */
  async createComment(
    postId: string,
    data: CreateCommentRequest
  ): Promise<CommentResponse> {
    const response = await apiClient.post<CommentResponse>(
      `/api/posts/${encodeURIComponent(postId)}/comments`,
      data
    );
    return response.data;
  },

  /**
   * Xóa bình luận
   * DELETE /api/posts/{postId}/comments/{commentId}
   */
  async deleteComment(postId: string, commentId: string): Promise<void> {
    await apiClient.delete(
      `/api/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`
    );
  },

  /**
   * Lấy danh sách trả lời của một bình luận
   * GET /api/posts/{postId}/comments/{commentId}/replies
   */
  async getReplies(
    postId: string,
    commentId: string,
    page = 0,
    size = 20
  ): Promise<PageCommentResponse> {
    const response = await apiClient.get<PageCommentResponse>(
      `/api/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/replies`,
      { params: { page, size } }
    );
    return response.data;
  },

  /**
   * Like bình luận
   * POST /api/posts/{postId}/comments/{commentId}/like
   */
  async likeComment(postId: string, commentId: string): Promise<void> {
    await apiClient.post(
      `/api/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/like`
    );
  },

  /**
   * Unlike bình luận
   * DELETE /api/posts/{postId}/comments/{commentId}/like
   */
  async unlikeComment(postId: string, commentId: string): Promise<void> {
    await apiClient.delete(
      `/api/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/like`
    );
  },

  /**
   * Lấy replies của bình luận
   * GET /api/posts/{postId}/comments/{commentId}/replies
   */
  async getCommentReplies(
    postId: string,
    commentId: string,
    page = 0,
    size = 20
  ): Promise<PageCommentResponse> {
    const response = await apiClient.get<PageCommentResponse>(
      `/api/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/replies`,
      { params: { page, size } }
    );
    return response.data;
  },

  // ==========================================
  // 4. STORIES API
  // ==========================================

  /**
   * Tạo story mới
   * POST /api/stories
   */
  async createStory(data: CreateStoryRequest): Promise<StoryResponse> {
    const response = await apiClient.post<StoryResponse>("/api/stories", data);
    return response.data;
  },

  /**
   * Feed story
   * GET /api/stories/feed
   */
  async getStoryFeed(page = 0, size = 20): Promise<PageStoryResponse> {
    const response = await apiClient.get<PageStoryResponse>("/api/stories/feed", {
      params: { page, size },
    });
    return response.data;
  },

  /**
   * Kho lưu trữ story đã hết hạn của tôi (Riêng tư)
   * GET /api/stories/archive
   */
  async getMyArchivedStories(page = 0, size = 20): Promise<PageStoryResponse> {
    const response = await apiClient.get<PageStoryResponse>("/api/stories/archive", {
      params: { page, size },
    });
    return response.data;
  },

  /**
   * Toàn bộ story của tôi (Active + Archived) để làm Tin nổi bật
   * GET /api/stories/me
   */
  async getMyStories(page = 0, size = 50): Promise<PageStoryResponse> {
    const response = await apiClient.get<PageStoryResponse>("/api/stories/me", {
      params: { page, size },
    });
    return response.data;
  },

  /**
   * Chi tiết story
   * GET /api/stories/{id}
   */
  async getStory(id: string): Promise<StoryResponse> {
    const response = await apiClient.get<StoryResponse>(
      `/api/stories/${encodeURIComponent(id)}`
    );
    return response.data;
  },

  /**
   * Xóa story
   * DELETE /api/stories/{id}
   */
  async deleteStory(id: string): Promise<void> {
    await apiClient.delete(`/api/stories/${encodeURIComponent(id)}`);
  },

  /**
   * Đánh dấu đã xem story
   * POST /api/stories/{id}/view
   */
  async viewStory(id: string): Promise<void> {
    await apiClient.post(`/api/stories/${encodeURIComponent(id)}/view`);
  },

  /**
   * Danh sách người xem story (chỉ tác giả)
   * GET /api/stories/{id}/viewers
   */
  async getStoryViewers(
    id: string,
    page = 0,
    size = 20
  ): Promise<PageStoryViewerResponse> {
    const response = await apiClient.get<PageStoryViewerResponse>(
      `/api/stories/${encodeURIComponent(id)}/viewers`,
      { params: { page, size } }
    );
    return response.data;
  },

  // ==========================================
  // 5. FOLLOWS API
  // ==========================================

  /**
   * Danh sách followers của tôi hoặc user khác
   * GET /api/follows/followers
   */
  async getFollowers(
    page = 0,
    size = 20,
    userId?: string
  ): Promise<PageFollowResponse> {
    const response = await apiClient.get<PageFollowResponse>(
      "/api/follows/followers",
      {
        params: {
          page,
          size,
          ...(userId ? { userId } : {}),
        },
      }
    );
    return response.data;
  },

  /**
   * Danh sách following của tôi hoặc user khác
   * GET /api/follows/following
   */
  async getFollowing(
    page = 0,
    size = 20,
    userId?: string
  ): Promise<PageFollowResponse> {
    const response = await apiClient.get<PageFollowResponse>(
      "/api/follows/following",
      {
        params: {
          page,
          size,
          ...(userId ? { userId } : {}),
        },
      }
    );
    return response.data;
  },

  /**
   * Danh sách follow requests đang chờ duyệt
   * GET /api/follows/requests
   */
  async getPendingFollowRequests(
    page = 0,
    size = 20
  ): Promise<PageFollowResponse> {
    const response = await apiClient.get<PageFollowResponse>(
      "/api/follows/requests",
      { params: { page, size } }
    );
    return response.data;
  },

  /**
   * Chấp nhận follow request
   * POST /api/follows/requests/{followId}/accept
   */
  async acceptFollowRequest(followId: string): Promise<FollowResponse> {
    const response = await apiClient.post<FollowResponse>(
      `/api/follows/requests/${encodeURIComponent(followId)}/accept`
    );
    return response.data;
  },

  /**
   * Từ chối follow request
   * POST /api/follows/requests/{followId}/reject
   */
  async rejectFollowRequest(followId: string): Promise<void> {
    await apiClient.post(
      `/api/follows/requests/${encodeURIComponent(followId)}/reject`
    );
  },

  /**
   * Follow user
   * POST /api/follows/{userId}
   */
  async followUser(userId: string): Promise<FollowResponse> {
    const response = await apiClient.post<FollowResponse>(
      `/api/follows/${encodeURIComponent(userId)}`
    );
    return response.data;
  },

  /**
   * Unfollow user
   * DELETE /api/follows/{userId}
   */
  async unfollowUser(userId: string): Promise<void> {
    await apiClient.delete(`/api/follows/${encodeURIComponent(userId)}`);
  },

  /**
   * Trạng thái follow của tôi với một user
   * GET /api/follows/status/{targetUserId}
   */
  async getFollowStatus(
    targetUserId: string
  ): Promise<{ following: boolean; status?: string | null }> {
    const response = await apiClient.get<{ following: boolean; status?: string | null }>(
      `/api/follows/status/${encodeURIComponent(targetUserId)}`
    );
    return response.data;
  },

  // ==========================================
  // 6. SAVED POSTS & COLLECTIONS API
  // ==========================================

  /**
   * Danh sách bài đăng đã lưu
   * GET /api/saved
   */
  async getSavedPosts(page = 0, size = 20): Promise<PagePostResponse> {
    const response = await apiClient.get<PagePostResponse>("/api/saved", {
      params: { page, size },
    });
    return response.data;
  },

  /**
   * Danh sách bộ sưu tập của tôi
   * GET /api/saved/collections
   */
  async getMyCollections(): Promise<CollectionResponse[]> {
    const response = await apiClient.get<CollectionResponse[]>(
      "/api/saved/collections"
    );
    return response.data;
  },

  /**
   * Tạo bộ sưu tập mới
   * POST /api/saved/collections
   */
  async createCollection(
    data: CreateCollectionRequest
  ): Promise<CollectionResponse> {
    const response = await apiClient.post<CollectionResponse>(
      "/api/saved/collections",
      data
    );
    return response.data;
  },

  /**
   * Xóa bộ sưu tập
   * DELETE /api/saved/collections/{collectionId}
   */
  async deleteCollection(collectionId: string): Promise<void> {
    await apiClient.delete(
      `/api/saved/collections/${encodeURIComponent(collectionId)}`
    );
  },

  /**
   * Lưu bài đăng (có thể truyền collectionId)
   * POST /api/saved/{postId}
   */
  async savePost(postId: string, data?: SavePostRequest): Promise<void> {
    await apiClient.post(
      `/api/saved/${encodeURIComponent(postId)}`,
      data ?? {}
    );
  },

  /**
   * Bỏ lưu bài đăng
   * DELETE /api/saved/{postId}
   */
  async unsavePost(postId: string): Promise<void> {
    await apiClient.delete(`/api/saved/${encodeURIComponent(postId)}`);
  },

  // ==========================================
  // 7. HASHTAGS API
  // ==========================================

  /**
   * Tìm kiếm hashtag
   * GET /api/hashtags/search
   */
  async searchHashtags(q: string): Promise<HashtagResponse[]> {
    const response = await apiClient.get<HashtagResponse[]>(
      "/api/hashtags/search",
      { params: { q } }
    );
    return response.data;
  },

  /**
   * Bài đăng theo hashtag
   * GET /api/hashtags/{tag}/posts
   */
  async getPostsByHashtag(
    tag: string,
    page = 0,
    size = 20
  ): Promise<PagePostResponse> {
    const cleanTag = tag.replace(/^#/, "");
    const response = await apiClient.get<PagePostResponse>(
      `/api/hashtags/${encodeURIComponent(cleanTag)}/posts`,
      { params: { page, size } }
    );
    return response.data;
  },

  // ==========================================
  // 8. REPORTS API (USER-SIDE ONLY)
  // ==========================================

  /**
   * Gửi báo cáo vi phạm (POST / COMMENT / USER)
   * POST /api/reports
   */
  async createReport(data: CreateReportRequest): Promise<ReportResponse> {
    const response = await apiClient.post<ReportResponse>("/api/reports", data);
    return response.data;
  },

  // ==========================================
  // 9. STORY HIGHLIGHTS API
  // ==========================================

  /**
   * Tạo tin nổi bật mới
   * POST /api/highlights
   */
  async createHighlight(data: CreateHighlightRequest): Promise<HighlightResponse> {
    const response = await apiClient.post<HighlightResponse>("/api/highlights", data);
    return response.data;
  },

  /**
   * Lấy danh sách tin nổi bật của một người dùng
   * GET /api/highlights/user/{userId}
   */
  async getUserHighlights(userId: string): Promise<HighlightResponse[]> {
    const response = await apiClient.get<HighlightResponse[]>(`/api/highlights/user/${userId}`);
    return response.data;
  },

  /**
   * Lấy chi tiết tin nổi bật kèm danh sách story
   * GET /api/highlights/{id}
   */
  async getHighlightDetail(highlightId: string): Promise<HighlightDetailResponse> {
    const response = await apiClient.get<HighlightDetailResponse>(`/api/highlights/${highlightId}`);
    return response.data;
  },

  /**
   * Thêm story vào tin nổi bật
   * POST /api/highlights/{id}/stories/{storyId}
   */
  async addStoryToHighlight(highlightId: string, storyId: string): Promise<void> {
    await apiClient.post(`/api/highlights/${highlightId}/stories/${storyId}`);
  },

  /**
   * Xóa story khỏi tin nổi bật
   * DELETE /api/highlights/{id}/stories/{storyId}
   */
  async removeStoryFromHighlight(highlightId: string, storyId: string): Promise<void> {
    await apiClient.delete(`/api/highlights/${highlightId}/stories/${storyId}`);
  },

  /**
   * Xóa tin nổi bật
   * DELETE /api/highlights/{id}
   */
  async deleteHighlight(highlightId: string): Promise<void> {
    await apiClient.delete(`/api/highlights/${highlightId}`);
  },
};
