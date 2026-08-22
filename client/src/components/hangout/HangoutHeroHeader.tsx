import React from 'react'
import { ArrowLeft, Share2, Calendar, MapPin } from 'lucide-react'
import { AvatarStack, Badge } from '../ui'
import { formatDate } from '../../lib/format'
import { members } from '../../data/mock'

interface HangoutHeroHeaderProps {
  title: string
  coverImage: string
  date: string
  location: string
  participants: string[]
  onBack: () => void
}

export const HangoutHeroHeader: React.FC<HangoutHeroHeaderProps> = ({
  title,
  coverImage,
  date,
  location,
  participants,
  onBack,
}) => {
  const avatarList = participants.map((p) => ({
    src: members[p]?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${p}`,
    alt: members[p]?.name || p,
    title: members[p]?.name || p,
  }))

  return (
    <div className="hangout-hero-header">
      {/* Cover Image Banner */}
      <div className="detail-cover-container">
        <img src={coverImage} alt={title} className="detail-cover-img" />
        <div className="cover-floating-btns">
          <button
            className="frosted-btn"
            onClick={onBack}
            aria-label="Back to timeline"
            type="button"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            className="frosted-btn"
            aria-label="Share hangout"
            type="button"
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* Title Block */}
      <section className="title-section">
        <div className="title-row">
          <h2>{title}</h2>
        </div>

        <div className="metadata-row">
          <div className="meta-item">
            <Calendar size={16} />
            <span>{formatDate(date, 'long')}</span>
          </div>
          <div className="meta-item">
            <MapPin size={16} className="loc-pin" />
            <span>{location}</span>
          </div>
        </div>

        <div className="participants-row">
          <span className="participants-label">Joined:</span>
          <AvatarStack size={36} overlap={12} avatars={avatarList} />
          <div
            className="badge-offset-wrapper"
            style={{ transform: `translateX(-${(participants.length - 1) * 12}px)` }}
          >
            <Badge variant="surface" size="sm">
              {participants.length} {participants.length === 1 ? 'member' : 'members'}
            </Badge>
          </div>
        </div>
      </section>

      <style jsx>{`
        .hangout-hero-header {
          margin-bottom: 24px;
        }

        .detail-cover-container {
          position: relative;
          width: 100%;
          height: 280px;
          border-radius: 0 0 28px 28px;
          overflow: hidden;
          box-shadow: var(--shadow-ambient);
        }

        .detail-cover-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .cover-floating-btns {
          position: absolute;
          top: 20px;
          left: 20px;
          right: 20px;
          display: flex;
          justify-content: space-between;
          z-index: 10;
        }

        .frosted-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(8px);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text);
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s, background-color 0.2s;
        }

        .frosted-btn:hover {
          transform: scale(1.08);
          background: rgba(255, 255, 255, 1);
        }

        .title-section {
          padding: 24px 20px 0 20px;
        }

        .title-row h2 {
          font-size: 32px;
          color: var(--color-text);
          margin: 0 0 8px 0;
        }

        .metadata-row {
          display: flex;
          gap: 20px;
          font-size: 14px;
          color: var(--color-text-muted);
          margin-bottom: 18px;
          flex-wrap: wrap;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        :global(.loc-pin) {
          color: var(--color-blush);
        }

        .participants-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .participants-label {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 14px;
          color: var(--color-text-muted);
        }

        .badge-offset-wrapper {
          display: inline-flex;
        }
      `}</style>
    </div>
  )
}
