export interface Member {
  id: string
  name: string
  avatar: string
}

export const members: Record<string, Member> = {
  mika: { id: 'mika', name: 'Mika', avatar: '/avatars/mika.svg' },
  jam: { id: 'jam', name: 'Jam', avatar: '/avatars/jam.svg' },
  dave: { id: 'dave', name: 'Dave', avatar: '/avatars/dave.svg' },
}

export const DEFAULT_AVATAR = '/avatars/mika.svg'

export const profileAvatars = [
  '/avatars/avatar-1.svg',
  '/avatars/avatar-2.svg',
  '/avatars/avatar-3.svg',
  '/avatars/avatar-4.svg',
  '/avatars/avatar-5.svg',
  '/avatars/avatar-6.svg',
  '/avatars/avatar-7.svg',
  '/avatars/avatar-8.svg',
]

