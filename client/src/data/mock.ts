export interface Member {
  id: string
  name: string
  avatar: string
}

export const members: Record<string, Member> = {
  mika: { id: 'mika', name: 'Mika', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=mika' },
  jam: { id: 'jam', name: 'Jam', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=jam' },
  dave: { id: 'dave', name: 'Dave', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=dave' },
  chloe: { id: 'chloe', name: 'Chloe', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=chloe' },
}

export const memberList: Member[] = Object.values(members)

export const selectableMembers: Member[] = [members.jam, members.dave, members.chloe]

export const profileAvatars = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=mika',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=bunny',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=adventurer-1',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=happy-cat',
]

export type NoteType = 'butter' | 'blush' | 'sea'

export interface HangoutPhoto {
  id: string
  url: string
  uploadedBy: string
  likes: number
  span: 1 | 2
}

export interface HangoutNote {
  id: string
  author: string
  text: string
  time: string
  type: NoteType
  rotation: number
}

export interface HangoutExpense {
  id: string
  desc: string
  amount: number
  paidBy: string
  splitWith: string[]
  category: string
}

export interface Hangout {
  id: string
  title: string
  description: string
  date: string
  location: string
  coverImage: string
  participants: string[]
  rating: number
  rotation: number
  photos: HangoutPhoto[]
  notes: HangoutNote[]
  expenses: HangoutExpense[]
}

export const hangouts: Hangout[] = [
  {
    id: '1',
    title: 'Friday Night Ramen',
    description:
      'Craving spicy tonkotsu ramen after a long week. Ended up talking for hours about trip planning and old college memories. We ordered the special Gyoza too!',
    date: '2025-07-29',
    location: 'Ramen Nagi, BGC',
    coverImage: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80',
    participants: ['mika', 'jam', 'dave'],
    rating: 4,
    rotation: -1,
    photos: [
      { id: 'p1', url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80', uploadedBy: 'mika', likes: 4, span: 2 },
      { id: 'p2', url: 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&fit=crop&w=600&q=80', uploadedBy: 'jam', likes: 2, span: 1 },
      { id: 'p3', url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80', uploadedBy: 'dave', likes: 3, span: 1 },
      { id: 'p4', url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80', uploadedBy: 'mika', likes: 5, span: 2 },
    ],
    notes: [
      { id: 'n1', author: 'mika', text: 'Jam ate 3 bowls of noodles! Certified black hole stomach.', time: '1 year ago', type: 'butter', rotation: -1.5 },
      { id: 'n2', author: 'dave', text: 'Note to self: The Red King ramen at Level 3 spice is actually spicy. Bring milk next time.', time: '1 year ago', type: 'blush', rotation: 1.2 },
      { id: 'n3', author: 'jam', text: 'Next meetup should be at the beach! Let\u2019s plan for next month.', time: '1 year ago', type: 'sea', rotation: 2.0 },
    ],
    expenses: [
      { id: 'e1', desc: 'Ramen Bowls & Gyoza', amount: 1800, paidBy: 'mika', splitWith: ['mika', 'jam', 'dave'], category: 'Food' },
      { id: 'e2', desc: 'Dessert & Milk tea', amount: 450, paidBy: 'jam', splitWith: ['mika', 'jam', 'dave'], category: 'Drinks' },
    ],
  },
  {
    id: '2',
    title: 'Beach Day Picnic',
    description: 'Road trip to the beach! Super clear waters and awesome music.',
    date: '2026-07-15',
    location: 'Anawangin Cove',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    participants: ['mika', 'jam', 'dave', 'chloe'],
    rating: 5,
    rotation: 1.5,
    photos: [],
    notes: [],
    expenses: [],
  },
  {
    id: '3',
    title: 'Coffee & Boardgames',
    description: 'Relaxing afternoon cafe session.',
    date: '2026-07-26',
    location: 'Wildflour Cafe',
    coverImage: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80',
    participants: ['mika', 'dave'],
    rating: 4,
    rotation: -2,
    photos: [],
    notes: [],
    expenses: [],
  },
]

export const hangoutById = (id: string | string[] | undefined): Hangout | undefined => {
  const key = Array.isArray(id) ? id[0] : id
  return hangouts.find((h) => h.id === key)
}

export interface MapPin {
  id: string
  x: number
  y: number
  type: 'recent' | 'older'
}

export const mapPins: MapPin[] = [
  { id: '1', x: 280, y: 190, type: 'older' },
  { id: '2', x: 120, y: 110, type: 'recent' },
  { id: '3', x: 310, y: 160, type: 'recent' },
]

export const coverPlaceholders = [
  { name: 'Bonfire Vibe', url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80' },
  { name: 'Picnic Park', url: 'https://images.unsplash.com/photo-1526218626217-dc65a29bb444?auto=format&fit=crop&w=600&q=80' },
  { name: 'City Night Lights', url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80' },
  { name: 'Sunny Beach', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80' },
]

export const mockUploadOptions = [
  { label: 'Mock: Group Toast', url: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=600&q=80' },
  { label: 'Mock: Cafe Latte', url: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=600&q=80' },
]
