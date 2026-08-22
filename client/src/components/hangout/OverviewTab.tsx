import React from 'react'
import { MapPin } from 'lucide-react'
import { Card } from '../ui'

const emojis = ['😴', '😐', '🙂', '😊', '😍']

interface OverviewTabProps {
  description?: string
  location: string
  rating: number
  onRatingChange: (val: number) => void
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  description,
  location,
  rating,
  onRatingChange,
}) => {
  return (
    <div className="overview-tab">
      {description && (
        <Card variant="default" padding="md" className="overview-card">
          <h3>About the Meetup</h3>
          <p className="desc-text">{description}</p>
        </Card>
      )}

      {/* Mini Map Preview */}
      <Card variant="default" padding="md" className="overview-card">
        <h3>Location Details</h3>
        <div className="mini-map-container">
          <div className="mini-map-pin">
            <MapPin size={24} fill="var(--color-blush)" color="white" />
          </div>
          <span className="mini-map-label">{location}</span>
        </div>
      </Card>

      {/* Memory Rating Emoji Slider */}
      <Card variant="default" padding="md" className="overview-card">
        <h3>Memory Rating</h3>
        <p className="rating-subtitle">How did this hangout feel?</p>
        <div className="emoji-slider-wrapper">
          <div className="emoji-display">{emojis[rating]}</div>
          <div className="slider-container-box">
            <input
              type="range"
              min="0"
              max="4"
              value={rating}
              onChange={(e) => onRatingChange(parseInt(e.target.value))}
              className="emoji-range-input"
            />
            <div className="slider-labels">
              <span>Cozy</span>
              <span>Great</span>
              <span>Unforgettable!</span>
            </div>
          </div>
        </div>
      </Card>

      <style jsx>{`
        .overview-tab {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        :global(.overview-card) {
          margin-bottom: 0;
        }

        h3 {
          font-size: 18px;
          color: var(--color-text);
          margin: 0 0 8px 0;
        }

        .desc-text {
          font-size: 15px;
          color: var(--color-text-muted);
          line-height: 1.5;
          margin: 0;
        }

        .mini-map-container {
          height: 120px;
          border-radius: 16px;
          background: linear-gradient(135deg, var(--tint-sea), var(--tint-butter));
          border: 1px solid var(--color-surface-container-high);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 10px;
        }

        .mini-map-pin {
          animation: bounce 1.5s ease-in-out infinite;
        }

        .mini-map-label {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 14px;
          color: var(--color-text);
        }

        .rating-subtitle {
          font-size: 13px;
          color: var(--color-text-muted);
          margin: 0 0 14px 0;
        }

        .emoji-slider-wrapper {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .emoji-display {
          font-size: 40px;
          line-height: 1;
        }

        .slider-container-box {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .emoji-range-input {
          width: 100%;
          accent-color: var(--color-blush);
          cursor: pointer;
        }

        .slider-labels {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          font-weight: 700;
          color: var(--color-text-muted);
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }
      `}</style>
    </div>
  )
}
