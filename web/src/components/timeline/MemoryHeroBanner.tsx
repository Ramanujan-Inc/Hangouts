import React from 'react'
import Link from 'next/link'
import { Heart, MapPin, Sparkles, ArrowRight } from 'lucide-react'
import { Badge, AvatarStack } from '../ui'
import { getAvatarUrl } from '../../lib/avatar'
import { getHangoutUrl } from '../../lib/hangoutUrl'
import { Memory, DEFAULT_COVER } from './types'

interface MemoryHeroBannerProps {
  memory: Memory | null
  showMemory?: boolean
  onDismiss?: () => void
}

export const MemoryHeroBanner: React.FC<MemoryHeroBannerProps> = ({
  memory,
  showMemory = true,
}) => {
  if (!showMemory || !memory) return null

  const isExactDay = memory.days_diff === 0 || memory.days_diff === undefined
  const memoryTimeAgoText = isExactDay
    ? (memory.years_ago === 1 ? 'One year ago today...' : `${memory.years_ago} years ago today...`)
    : (memory.years_ago === 1 ? 'Around this time 1 year ago...' : `Around this time ${memory.years_ago} years ago...`)

  const participantsList = memory.participants || []
  const avatarStackItems = participantsList.map((p, pIdx) => {
    const username = p.profile?.username || `Member${pIdx}`
    return {
      src: getAvatarUrl(p.profile?.avatar_url),
      alt: username,
    }
  })

  const participantNames = participantsList
    .slice(0, 3)
    .map((p) => p.profile?.username || 'Friend')
    .join(', ')
  const remainingCount = participantsList.length - 3
  const participantSummaryText =
    participantsList.length === 0
      ? null
      : participantsList.length <= 3
      ? `with ${participantNames}`
      : `with ${participantNames} +${remainingCount}`

  return (
    <div className="memory-banner-card">
      <div className="memory-banner-content">
        <div className="memory-banner-text">
          <div className="memory-tag-wrapper">
            <Badge variant="blush" size="md" icon={<Heart size={13} fill="currentColor" />}>
              {memoryTimeAgoText}
            </Badge>
          </div>

          <h3 className="memory-title">{memory.title}</h3>

          <div className="memory-meta-row">
            {memory.location_name && (
              <p className="memory-loc">
                <MapPin size={14} className="loc-icon" />
                <span>{memory.location_name}</span>
              </p>
            )}

            {avatarStackItems.length > 0 && (
              <div className="memory-participants">
                <AvatarStack size={24} overlap={7} avatars={avatarStackItems} />
                {participantSummaryText && (
                  <span className="participants-text">{participantSummaryText}</span>
                )}
              </div>
            )}
          </div>

          <Link href={getHangoutUrl(memory)} className="memory-cta-btn">
            <Sparkles size={15} />
            <span>Relive this memory</span>
            <ArrowRight size={14} className="cta-arrow" />
          </Link>
        </div>

        <Link href={getHangoutUrl(memory)} className="memory-banner-polaroid" aria-label={`View ${memory.title}`}>
          <div className="polaroid-inset">
            <div className="washi-tape" />
            <img
              src={memory.cover_photo_url || DEFAULT_COVER}
              alt={memory.title}
              className="polaroid-img"
            />
            <div className="polaroid-caption">{memory.title}</div>
          </div>
        </Link>
      </div>

      <style jsx>{`
        .memory-banner-card {
          background: var(--memory-banner-bg);
          border: 1px solid var(--memory-banner-border);
          border-radius: 28px;
          padding: 26px 32px;
          margin-bottom: 32px;
          position: relative;
          box-shadow: var(--memory-banner-shadow);
          overflow: hidden;
        }

        .memory-banner-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 28px;
        }

        .memory-banner-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }

        .memory-tag-wrapper {
          display: inline-block;
        }

        .memory-title {
          font-family: var(--font-display);
          font-size: 24px;
          font-weight: 800;
          color: var(--color-text);
          margin: 2px 0 0 0;
          line-height: 1.25;
        }

        .memory-meta-row {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          margin: 2px 0 6px 0;
        }

        .memory-loc {
          font-size: 13px;
          color: var(--color-text-muted);
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 0;
        }

        :global(.loc-icon) {
          color: var(--color-blush);
        }

        .memory-participants {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .participants-text {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text-muted);
        }

        .memory-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 9999px;
          background-color: var(--color-blush);
          color: white;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 13px;
          text-decoration: none;
          box-shadow: 0 4px 14px rgba(227, 104, 136, 0.3);
          margin-top: 6px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .memory-cta-btn:hover {
          background-color: #d15676;
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(227, 104, 136, 0.4);
        }

        :global(.cta-arrow) {
          transition: transform 0.2s ease;
        }

        .memory-cta-btn:hover :global(.cta-arrow) {
          transform: translateX(3px);
        }

        .memory-banner-polaroid {
          flex-shrink: 0;
          text-decoration: none;
          cursor: pointer;
        }

        .polaroid-inset {
          position: relative;
          background-color: #ffffff;
          padding: 10px 10px 14px 10px;
          border-radius: 14px;
          box-shadow: 0 12px 28px rgba(46, 42, 40, 0.14), 0 2px 6px rgba(0, 0, 0, 0.06);
          transform: rotate(3deg);
          width: 144px;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .polaroid-inset:hover {
          transform: rotate(0deg) scale(1.06) translateY(-4px);
          box-shadow: 0 16px 36px rgba(46, 42, 40, 0.2);
        }

        .washi-tape {
          position: absolute;
          top: -8px;
          left: 50%;
          transform: translateX(-50%) rotate(-3deg);
          width: 44px;
          height: 14px;
          background: rgba(242, 114, 89, 0.45);
          backdrop-filter: blur(4px);
          border-radius: 2px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          z-index: 2;
        }

        .polaroid-img {
          width: 100%;
          height: 105px;
          object-fit: cover;
          border-radius: 8px;
          display: block;
        }

        .polaroid-caption {
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 700;
          color: var(--color-text);
          margin-top: 8px;
          text-align: center;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @media (max-width: 600px) {
          .memory-banner-card {
            padding: 20px;
          }

          .memory-banner-content {
            flex-direction: column-reverse;
            align-items: flex-start;
            gap: 16px;
          }

          .polaroid-inset {
            width: 120px;
            transform: rotate(2deg);
          }
        }
      `}</style>
    </div>
  )
}
