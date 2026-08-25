export interface MemberProfile {
  id: string
  username: string
  email: string
  avatar_url?: string
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  status: string
  joined_at: string
  profile?: MemberProfile
}

export interface Group {
  id: string
  name: string
  cover_image_url?: string
  created_by: string
  created_at: string
  members?: GroupMember[]
}

export interface GroupInvite {
  id: string
  group_id: string
  status: string
  joined_at: string
  group?: Group
  inviter?: MemberProfile
}

export const PRESET_COVERS = [
  '/images/covers/group-1.jpg',
  '/images/covers/group-2.jpg',
  '/images/covers/group-3.jpg',
  '/images/covers/group-4.jpg',
]
