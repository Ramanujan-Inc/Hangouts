import React from 'react'
import { Card, AvatarStack } from '../ui'
import { getAvatarUrl } from '../../lib/avatar'
import { Group } from './types'

interface GroupCardProps {
  group: Group
  onClick: () => void
}

export const GroupCard: React.FC<GroupCardProps> = ({ group, onClick }) => {
  const members = group.members || []
  const avatars = members.map((m) => {
    const username = m.profile?.username || m.user_id || 'Member'
    return {
      src: getAvatarUrl(m.profile?.avatar_url),
      alt: username,
      title: username,
    }
  })

  const memberNamesText = members
    .slice(0, 3)
    .map((m) => m.profile?.username || 'User')
    .join(', ')

  const extraCount = members.length > 3 ? ` +${members.length - 3} more` : ''

  return (
    <Card
      variant="default"
      padding="none"
      hoverable
      clickable
      onClick={onClick}
      className="group-card"
    >
      {/* Cover Banner */}
      <div
        className="group-cover"
        style={{
          backgroundImage: group.cover_image_url
            ? `url(${group.cover_image_url})`
            : 'linear-gradient(135deg, var(--color-surface-container), var(--tint-butter))',
        }}
      />

      {/* Card Body */}
      <div className="group-body">
        <div className="group-info">
          <h3 className="group-name">{group.name}</h3>
        </div>

        {avatars.length > 0 && (
          <div className="members-row">
            <AvatarStack avatars={avatars} size={32} overlap={10} />
            <span className="member-names">
              {memberNamesText}
              {extraCount}
            </span>
          </div>
        )}
      </div>

      <style jsx>{`
        :global(.group-card) {
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .group-cover {
          height: 120px;
          width: 100%;
          background-size: cover;
          background-position: center;
          border-bottom: 1px solid var(--color-surface-container-high);
        }

        .group-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          flex: 1;
        }

        .group-name {
          font-size: 18px;
          font-weight: 700;
          color: var(--color-text);
          margin: 0;
        }

        .members-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .member-names {
          font-size: 13px;
          color: var(--color-text-muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }
      `}</style>
    </Card>
  )
}
