import React from 'react'
import Link from 'next/link'
import { MapPin, Calendar } from 'lucide-react'
import { AvatarStack, Badge } from '../ui'
import { formatDate } from '../../lib/format'
import { getAvatarUrl } from '../../lib/avatar'
import { Hangout, DEFAULT_COVER } from './types'

interface HangoutCardProps {
  hangout: Hangout
  index: number
}

export const HangoutCard: React.FC<HangoutCardProps> = ({ hangout, index }) => {
  const rotationDeg = ((index % 5) - 2) * 1.5
  const participantsList = hangout.participants || []

  const avatarStackItems = participantsList.map((p, pIdx) => {
    const username = p.profile?.username || `Member${pIdx}`
    return {
      src: getAvatarUrl(p.profile?.avatar_url),
      alt: username,
    }
  })

  return (
    <Link href={`/hangout/${hangout.id}`} className="hangout-card-link">
      <div
        className="polaroid-card hangout-card"
        style={{
          '--hover-rotate': `${rotationDeg * 1.5}deg`,
          transform: `rotate(${rotationDeg * 0.6}deg)`,
        } as React.CSSProperties}
      >
        <div className="polaroid-image-container">
          <img
            src={hangout.cover_photo_url || DEFAULT_COVER}
            className="polaroid-image"
            alt={hangout.title}
          />
          <div className="date-badge-wrapper">
            <Badge variant="surface" size="sm" icon={<Calendar size={12} />}>
              {formatDate(hangout.hangout_date)}
            </Badge>
          </div>
        </div>

        <div className="card-info">
          <h4 className="card-title">{hangout.title}</h4>
          {hangout.description && <p className="card-desc">{hangout.description}</p>}

          <div className="card-footer">
            <div className="card-location">
              <MapPin size={14} className="location-pin-icon" />
              <span className="location-name">{hangout.location_name || 'Somewhere fun'}</span>
            </div>
            {avatarStackItems.length > 0 && (
              <AvatarStack size={28} overlap={8} avatars={avatarStackItems} />
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        :global(.hangout-card-link) {
          text-decoration: none;
          color: inherit;
          display: block;
        }

        .hangout-card {
          cursor: pointer;
        }

        .polaroid-image-container {
          position: relative;
        }

        .date-badge-wrapper {
          position: absolute;
          top: 10px;
          right: 10px;
        }

        .card-info {
          padding-top: 14px;
        }

        .card-title {
          font-size: 18px;
          margin: 0 0 6px 0;
          color: var(--color-text);
        }

        .card-desc {
          font-size: 13px;
          color: var(--color-text-muted);
          margin: 0 0 12px 0;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 6px;
          gap: 10px;
        }

        .card-location {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--color-text-muted);
          font-weight: 600;
          min-width: 0;
          flex: 1;
        }

        :global(.location-pin-icon) {
          flex-shrink: 0;
        }

        .location-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </Link>
  )
}
