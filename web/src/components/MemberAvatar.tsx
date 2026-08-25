import React from 'react'
import { members } from '../data/mock'
import { getAvatarUrl } from '../lib/avatar'
import Avatar from './ui/Avatar'
import { UserProfile } from './hangout/types'

interface MemberAvatarProps {
  memberId?: string
  profile?: UserProfile | null
  name?: string
  avatarUrl?: string | null
  size?: number
}

export default function MemberAvatar({
  memberId,
  profile,
  name,
  avatarUrl,
  size = 28,
}: MemberAvatarProps) {
  const resolvedName = profile?.username || name || (memberId ? members[memberId]?.name : undefined) || memberId || 'User'
  const customAvatar = profile?.avatar_url || avatarUrl || (memberId ? members[memberId]?.avatar : undefined)
  const resolvedAvatar = getAvatarUrl(customAvatar)

  return <Avatar src={resolvedAvatar} alt={resolvedName} size={size} title={resolvedName} />
}
