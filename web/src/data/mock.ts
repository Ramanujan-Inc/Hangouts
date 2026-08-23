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

export const profileAvatars = [
  'https://api.dicebear.com/7.x/adventurer/svg?hair=long05&hairColor=e5d7a3&skinColor=f2d3b1&eyes=variant01&eyebrows=variant02&mouth=variant12&features=blush&featuresProbability=100&earrings=variant01&earringsProbability=100',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Jack',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=mika',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Aria',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Oliver',
  'https://api.dicebear.com/7.x/adventurer/svg?hair=short16&hairColor=afafaf&skinColor=f2d3b1&eyes=variant10&eyebrows=variant08&mouth=variant24&earrings=variant02&earringsProbability=100',
  'https://api.dicebear.com/7.x/adventurer/svg?hair=long10&hairColor=cb6820&skinColor=f2d3b1&eyes=variant08&eyebrows=variant02&mouth=variant12&features=blush&featuresProbability=100&earrings=variant03&earringsProbability=100',
  'https://api.dicebear.com/7.x/adventurer/svg?hair=long21&hairColor=592454&skinColor=f2d3b1&eyes=variant22&eyebrows=variant10&mouth=variant05&features=blush&featuresProbability=100&glasses=variant05&glassesProbability=100',
]
