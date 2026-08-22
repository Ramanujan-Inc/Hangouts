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
}

export interface SuggestedSpot {
  name: string
  desc: string
  lat: number
  lng: number
}

export const SUGGESTED_SPOTS: SuggestedSpot[] = [
  { name: 'Ramen Nagi, Bonifacio High Street', desc: 'BGC, Taguig City', lat: 14.5517, lng: 121.0505 },
  { name: 'Wildflour Cafe + Bakery, Net Lima', desc: 'BGC, Taguig City', lat: 14.5492, lng: 121.0478 },
  { name: 'Ayala Triangle Gardens', desc: 'Makati Central Business District', lat: 14.5574, lng: 121.0232 },
  { name: 'Intramuros Historic District', desc: 'Manila City', lat: 14.5898, lng: 120.9734 },
  { name: 'UP Sunken Garden', desc: 'Diliman, Quezon City', lat: 14.6538, lng: 121.0685 },
  { name: 'SM Mall of Asia Bay Area', desc: 'Pasay City', lat: 14.5352, lng: 120.9822 },
  { name: 'Camp Netanya Resort', desc: 'Anilao, Batangas', lat: 13.7565, lng: 120.8931 },
  { name: 'Tagaytay Ridge Overlook', desc: 'Tagaytay, Cavite', lat: 14.1153, lng: 120.9621 },
]
