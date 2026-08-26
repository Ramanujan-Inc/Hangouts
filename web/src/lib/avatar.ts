import { DEFAULT_AVATAR } from '../data/mock'

export { DEFAULT_AVATAR }

export function getAvatarUrl(customUrl?: string | null): string {
  if (customUrl && customUrl.trim().length > 0) {
    if (customUrl.includes('seed=mika') || customUrl.includes('seed=Mika')) return '/avatars/mika.svg'
    if (customUrl.includes('seed=jam') || customUrl.includes('seed=Jam')) return '/avatars/jam.svg'
    if (customUrl.includes('seed=dave') || customUrl.includes('seed=Dave')) return '/avatars/dave.svg'
    if (customUrl.includes('seed=chloe') || customUrl.includes('seed=Chloe')) return '/avatars/chloe.svg'
    return customUrl
  }
  return DEFAULT_AVATAR
}
