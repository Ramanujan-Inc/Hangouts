export interface ParticipantProfile {
  id: string
  username: string
  email: string
  avatar_url?: string | null
}

export interface Participant {
  id: string
  hangout_id: string
  user_id: string
  profile?: ParticipantProfile | null
}

export interface Hangout {
  id: string
  title: string
  description?: string | null
  hangout_date: string
  hangout_time?: string | null
  location_name?: string | null
  latitude?: number | null
  longitude?: number | null
  cover_photo_url?: string | null
  group_id?: string | null
  created_by: string
  created_at: string
  updated_at: string
  creator?: ParticipantProfile | null
  participants?: Participant[]
}

export interface Memory extends Hangout {
  years_ago: number
  days_diff?: number
}

export interface Group {
  id: string
  name: string
  description?: string | null
  cover_image_url?: string | null
}

export type QuickFilter = 'All' | 'Created by Me' | 'This Month' | 'Memories'

export const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80'
