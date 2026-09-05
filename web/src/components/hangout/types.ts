export type HangoutTab = 'overview' | 'media' | 'photos' | 'notes' | 'expenses'
export type NoteType = 'butter' | 'blush' | 'sea' | 'matcha'
export type MediaType = 'photo' | 'video'

export interface UserProfile {
  id: string
  username: string
  email?: string
  avatar_url?: string | null
  bio?: string | null
}

export interface HangoutParticipant {
  id: string
  hangout_id: string
  user_id: string
  profile?: UserProfile | null
}

export interface HangoutDetailData {
  id: string
  title: string
  description?: string | null
  hangout_date: string
  hangout_time?: string | null
  location_name?: string | null
  formatted_address?: string | null
  place_id?: string | null
  latitude?: number | null
  longitude?: number | null
  cover_photo_url?: string | null
  invite_code?: string | null
  created_by: string
  created_at: string
  updated_at: string
  creator?: UserProfile | null
  participants?: HangoutParticipant[]
  group_id?: string | null
}

export interface HangoutMedia {
  id: string
  hangout_id?: string
  uploaded_by: string
  url: string
  thumbnail_url?: string
  caption?: string | null
  media_type: MediaType
  favorites_count: number
  file_size_bytes?: number
  is_shared: boolean
  created_at?: string
  uploader?: UserProfile | null
  span?: 1 | 2
  is_favorited?: boolean
}

export interface HangoutNote {
  id: string
  hangout_id?: string
  created_by: string
  content: string
  color?: NoteType
  is_shared: boolean
  created_at?: string
  updated_at?: string
  author?: UserProfile | null
  type?: NoteType
  rotation?: number
}

export interface HangoutExpense {
  id: string
  hangout_id?: string
  paid_by: string
  description: string
  total_amount: number
  split_type: 'equal' | 'personal'
  created_at?: string
  payer?: UserProfile | null
}

export interface MemberBalance {
  user_id: string
  profile?: UserProfile | null
  total_paid: number
  total_paid_equal?: number
  net_balance: number
  owes: number
  is_owed: number
}

export interface DebtSettlement {
  from_user_id?: string
  from_user?: UserProfile | null
  to_user_id?: string
  to_user?: UserProfile | null
  from?: string
  to?: string
  amount: number
}

export interface ExpenseSummary {
  hangout_id: string
  total_expenses: number
  expense_count: number
  equal_split_total: number
  per_person_share: number
  participant_count: number
  member_balances: MemberBalance[]
  simplified_debts: DebtSettlement[]
}
