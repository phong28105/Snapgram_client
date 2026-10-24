export interface SortObject {
  empty?: boolean;
  sorted?: boolean;
  unsorted?: boolean;
}

export interface PageableObject {
  offset?: number;
  pageNumber?: number;
  pageSize?: number;
  paged?: boolean;
  unpaged?: boolean;
  sort?: SortObject;
}

// ==========================================
// 1. POSTS & MEDIA ITEMS
// ==========================================

export type PostContentType = "POST" | "REEL" | string;
export type ContentVisibility = "PUBLIC" | "FOLLOWERS" | "PRIVATE" | string;

export interface PostMediaRequest {
  mediaId?: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  mediaType?: string;
  sortOrder?: number;
  width?: number;
  height?: number;
  durationSec?: number;
}

export interface PostMediaResponse {
  id: string;
  mediaId?: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  mediaType?: string;
  sortOrder?: number;
  width?: number;
  height?: number;
  durationSec?: number;
  createdAt?: string;
}

export interface CreatePostRequest {
  contentType?: PostContentType;
  caption?: string;
  mediaId?: string;
  mediaUrl?: string;
  mediaList?: PostMediaRequest[];
  tags?: string;
  visibility?: ContentVisibility;
  hashtags?: string[];
  mentionedUserIds?: string[];
}

export interface UpdatePostRequest {
  caption?: string;
  tags?: string;
  visibility?: ContentVisibility;
}

export interface PostResponse {
  id: string;
  authorId: string;
  authorUsername?: string;
  authorDisplayName?: string;
  authorAvatarUrl?: string;
  contentType?: PostContentType;
  caption?: string;
  mediaId?: string;
  mediaUrl?: string;
  mediaItems?: PostMediaResponse[];
  tags?: string;
  likeCount?: number;
  commentCount?: number;
  viewCount?: number;
  status?: string;
  visibility?: ContentVisibility;
  editCount?: number;
  editedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  hashtags?: string[];
  mentionedUserIds?: string[];
  likedByMe?: boolean;
  recommendationReason?: string;
}

export interface PagePostResponse {
  totalPages: number;
  totalElements: number;
  size: number;
  content: PostResponse[];
  number: number;
  sort?: SortObject;
  pageable?: PageableObject;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ==========================================
// 2. INTERACTIONS
// ==========================================

export type InteractionType = "LIKE" | "VIEW" | "SHARE" | "SAVE" | "SKIP";

export interface InteractionRequest {
  type: InteractionType;
  watchTimeRatio?: number;
  explicitRating?: number;
}

// ==========================================
// 3. COMMENTS & REPLIES
// ==========================================

export interface CreateCommentRequest {
  content: string;
  parentCommentId?: string;
}

export interface CommentResponse {
  id: string;
  postId: string;
  authorId: string;
  authorUsername?: string;
  authorDisplayName?: string;
  authorAvatarUrl?: string;
  content: string;
  parentCommentId?: string;
  likeCount?: number;
  likedByMe?: boolean;
  /** Số trả lời trực tiếp — chỉ backend trả về cho comment gốc. */
  replyCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PageCommentResponse {
  totalPages: number;
  totalElements: number;
  size: number;
  content: CommentResponse[];
  number: number;
  sort?: SortObject;
  pageable?: PageableObject;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ==========================================
// 4. STORIES & VIEWERS
// ==========================================

export interface CreateStoryRequest {
  mediaUrl: string;
  mediaId?: string;
  mediaType: string;
  caption?: string;
  visibility?: ContentVisibility;
}

export interface StoryResponse {
  id: string;
  authorId: string;
  authorUsername?: string;
  authorDisplayName?: string;
  authorAvatarUrl?: string;
  mediaId?: string;
  mediaUrl: string;
  mediaType?: string;
  caption?: string;
  visibility?: ContentVisibility;
  viewedByMe?: boolean;
  createdAt?: string;
  expiresAt?: string;
}

export interface StoryViewerResponse {
  viewerId: string;
  viewedAt?: string;
}

export interface PageStoryResponse {
  totalPages: number;
  totalElements: number;
  size: number;
  content: StoryResponse[];
  number: number;
  sort?: SortObject;
  pageable?: PageableObject;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface PageStoryViewerResponse {
  totalPages: number;
  totalElements: number;
  size: number;
  content: StoryViewerResponse[];
  number: number;
  sort?: SortObject;
  pageable?: PageableObject;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ==========================================
// 5. FOLLOWS
// ==========================================

export interface FollowResponse {
  id: string;
  followerId: string;
  followingId: string;
  status?: "ACCEPTED" | "PENDING" | string;
  createdAt?: string;
}

export interface PageFollowResponse {
  totalPages: number;
  totalElements: number;
  size: number;
  content: FollowResponse[];
  number: number;
  sort?: SortObject;
  pageable?: PageableObject;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ==========================================
// 6. SAVED POSTS & COLLECTIONS
// ==========================================

export interface CreateCollectionRequest {
  name: string;
  private?: boolean;
}

export interface SavePostRequest {
  collectionId?: string;
}

export interface CollectionResponse {
  id: string;
  userId?: string;
  name: string;
  coverPostId?: string;
  createdAt?: string;
  private?: boolean;
}

// ==========================================
// 7. HASHTAGS
// ==========================================

export interface HashtagResponse {
  id: string;
  tag: string;
  postCount?: number;
  lastUsedAt?: string;
}

// ==========================================
// 8. REPORTS (USER-SIDE)
// ==========================================

export type ReportTargetType = "POST" | "COMMENT" | "USER";

export interface CreateReportRequest {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  description?: string;
}

export interface ReportResponse {
  id: string;
  reporterId?: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  description?: string;
  status?: "PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED" | string;
  createdAt?: string;
}

// ==========================================
// 9. STORY HIGHLIGHTS
// ==========================================

export interface CreateHighlightRequest {
  name: string;
  coverStoryId?: string;
  storyIds?: string[];
}

export interface HighlightResponse {
  id: string;
  userId: string;
  name: string;
  coverStoryId?: string;
  coverMediaUrl?: string;
  storyCount: number;
  createdAt: string;
}

export interface HighlightDetailResponse extends HighlightResponse {
  stories: StoryResponse[];
}
