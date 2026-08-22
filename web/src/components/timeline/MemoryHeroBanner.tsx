import React from 'react'
import Link from 'next/link'
import { Heart, MapPin, Sparkles, X } from 'lucide-react'
import { Badge } from '../ui'
import { Memory, DEFAULT_COVER } from './types'

interface MemoryHeroBannerProps {
  memory: Memory | null
  showMemory: boolean
  onDismiss: () => void
}

export const MemoryHeroBanner: React.FC<MemoryHeroBannerProps> = ({
  memory,
  showMemory,
  onDismiss,
}) => {
  if (!showMemory || !memory) return null

  const memoryTimeAgoText =
    memory.years_ago === 1 ? 'One year ago today...' : `${memory.years_ago} years ago today...`

  return (
    <div className="memory-banner-card">
      <button
        className="dismiss-memory"
        onClick={onDismiss}
        title="Dismiss memory banner"
        type="button"
        aria-label="Dismiss memory banner"
      >
        <X size={18} />
      </button>

      <div className="memory-banner-content">
        <div className="memory-banner-text">
          <div className="memory-tag-wrapper">
            <Badge variant="blush" size="md" icon={<Heart size={14} fill="currentColor" />}>
              {memoryTimeAgoText}
            </Badge>
          </div>

          <h3>{memory.title}</h3>

          {memory.location_name && (
            <p className="memory-loc">
              <MapPin size={14} /> {memory.location_name}
            </p>
          )}

          <Link href={`/hangout/${memory.id}`} className="memory-cta-btn">
            <Sparkles size={16} />
            <span>Relive this memory</span>
          </Link>
        </div>

        <div className="memory-banner-polaroid">
          <div className="polaroid-inset">
            <img src={memory.cover_photo_url || DEFAULT_COVER} alt={memory.title} />
            <div className="polaroid-caption">{memory.title}</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .memory-banner-card {
          background: linear-gradient(135deg, var(--tint-blush), var(--tint-butter));
          border: 1px solid rgba(227, 104, 136, 0.3);
          border-radius: 28px;
          padding: 28px;
          margin-bottom: 32px;
          position: relative;
          box-shadow: var(--shadow-ambient);
          overflow: hidden;
        }

        .dismiss-memory {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }

        .dismiss-memory:hover {
          background-color: rgba(0, 0, 0, 0.06);
        }

        .memory-banner-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .memory-banner-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
        }

        .memory-tag-wrapper {
          display: inline-block;
        }

        .memory-banner-text h3 {
          font-size: 24px;
          color: var(--color-text);
          margin: 0;
        }

        .memory-loc {
          font-size: 14px;
          color: var(--color-text-muted);
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 0;
        }

        .memory-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 22px;
          border-radius: 9999px;
          background-color: var(--color-blush);
          color: white;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          box-shadow: 0 4px 12px rgba(227, 104, 136, 0.25);
          margin-top: 4px;
          transition: transform 0.2s, background-color 0.2s;
        }

        .memory-cta-btn:hover {
          background-color: #d15676;
          transform: translateY(-1px);
        }

        .memory-banner-polaroid {
          flex-shrink: 0;
        }

        .polaroid-inset {
          background-color: white;
          padding: 10px 10px 18px 10px;
          border-radius: 14px;
          box-shadow: 0 10px 24px rgba(46, 42, 40, 0.12);
          transform: rotate(3deg);
          width: 140px;
          transition: transform 0.2s;
        }

        .polaroid-inset:hover {
          transform: rotate(0deg) scale(1.04);
        }

        .polaroid-inset img {
          width: 100%;
          height: 100px;
          object-fit: cover;
          border-radius: 8px;
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
          .memory-banner-content {
            flex-direction: column-reverse;
            align-items: flex-start;
          }
          .polaroid-inset {
            width: 120px;
          }
        }
      `}</style>
    </div>
  )
}
