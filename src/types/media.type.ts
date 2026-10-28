export interface MediaResponse {
  id: string
  ownerId: string
  url: string
  thumbnailUrl?: string
  mimeType: string
  sizeBytes: number
  status: string
  width?: number
  height?: number
  durationSec?: number
  createdAt: string
}

export interface PresignedUrlRequest {
  fileName: string
  mimeType: string
  sizeBytes: number
}

export interface PresignedUrlResponse {
  mediaId: string
  uploadUrl: string
  fileUrl: string
  expiresInSeconds: number
}

export interface PageMediaResponse {
  content: MediaResponse[]
  totalPages: number
  totalElements: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

export type CaptionTone = "FRIENDLY" | "FORMAL" | "FUNNY" | "SHORT"

export type MediaVisualType = "IMAGE" | "VIDEO"

export interface AiCaptionResponse {
  captions: string[]
  hashtags: string[]
  altText: string
  cacheHit: boolean
}
