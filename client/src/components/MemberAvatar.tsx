import React from 'react'
import { members } from '../data/mock'
import Avatar from './ui/Avatar'

interface MemberAvatarProps {
  memberId: string
  size?: number
}

export default function MemberAvatar({ memberId, size = 28 }: MemberAvatarProps) {
  const member = members[memberId]
  return <Avatar src={member.avatar} alt={member.name} size={size} title={member.name} />
}
