export interface GroupMemberProfile {
  id: string
  username: string
  avatar_url?: string | null
}

export interface GroupMember {
  id: string
  user_id: string
  status: string
  profile?: GroupMemberProfile | null
}

export interface Group {
  id: string
  name: string
  cover_image_url?: string | null
  members?: GroupMember[]
}

export interface HangoutResponse {
  id: string
  title: string
  hangout_date: string
  cover_photo_url?: string | null
}

export interface UploadedPhoto {
  id: string
  file: File
  previewUrl: string
  thumbnailBlob?: Blob
  thumbnailUrl?: string
  isVideo?: boolean
  caption?: string
}

