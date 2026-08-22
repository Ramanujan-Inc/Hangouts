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
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1543807535-eceef0bc6599?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80',
]
