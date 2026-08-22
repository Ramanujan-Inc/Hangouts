import React from 'react'
import dynamic from 'next/dynamic'
import { MapPin, ExternalLink, RefreshCw } from 'lucide-react'
import { Card } from '../ui'

const MapComponent = dynamic(() => import('../MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="mini-map-loading">
      <RefreshCw size={20} className="spin" />
      <span>Loading OpenStreetMap...</span>
    </div>
  ),
})

const emojis = ['😴', '😐', '🙂', '😊', '😍']

interface OverviewTabProps {
  title?: string
  description?: string | null
  location: string
  formattedAddress?: string | null
  latitude?: number | null
  longitude?: number | null
  placeId?: string | null
  coverPhotoUrl?: string | null
  rating: number
  onRatingChange: (val: number) => void
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  title,
  description,
  location,
  formattedAddress,
  latitude,
  longitude,
  placeId,
  coverPhotoUrl,
  rating,
  onRatingChange,
}) => {
  const emojiIndex = Math.min(Math.max((rating > 0 ? rating : 4) - 1, 0), 4)

  const hasCoords = latitude != null && longitude != null && !isNaN(Number(latitude)) && !isNaN(Number(longitude))
  const lat = hasCoords ? Number(latitude) : 14.5995
  const lng = hasCoords ? Number(longitude) : 120.9842

  const mapPin = {
    id: 'hangout-location',
    title: title || location,
    location_name: location,
    latitude: lat,
    longitude: lng,
    hangout_date: '',
    cover_photo_url: coverPhotoUrl || undefined,
  }

  const mapsUrl = placeId
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}&query_place_id=${placeId}`
    : hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`

  return (
    <div className="overview-tab">
      {description && (
        <Card variant="default" padding="md" className="overview-card">
          <h3>About the Meetup</h3>
          <p className="desc-text">{description}</p>
        </Card>
      )}

      {/* OpenStreetMap Location Details Card */}
      <Card variant="default" padding="md" className="overview-card">
        <div className="loc-card-header">
          <h3>Location Details</h3>
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="open-maps-link"
            >
              <span>Open in Google Maps</span>
              <ExternalLink size={13} />
            </a>
          )}
        </div>

        <div className="osm-map-wrapper">
          {hasCoords ? (
            <MapComponent
              pins={[mapPin]}
              selectedPin={mapPin}
              onSelectPin={() => {}}
              center={[lat, lng]}
              zoom={14}
            />
          ) : (
            <div className="no-coords-map-placeholder">
              <MapPin size={28} color="var(--color-blush)" />
              <span className="no-coords-title">{location}</span>
              {formattedAddress && <span className="no-coords-addr">{formattedAddress}</span>}
            </div>
          )}
        </div>

        <div className="location-info-footer">
          <div className="loc-main-row">
            <MapPin size={18} className="loc-footer-pin" />
            <div className="loc-text-col">
              <span className="loc-footer-name">{location}</span>
              {formattedAddress && formattedAddress !== location && (
                <span className="loc-footer-address">{formattedAddress}</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Memory Rating Emoji Slider */}
      <Card variant="default" padding="md" className="overview-card">
        <h3>Your Memory Rating</h3>
        <p className="rating-subtitle">How did this hangout feel for you?</p>
        <div className="emoji-slider-wrapper">
          <div className="emoji-display">{emojis[emojiIndex]}</div>
          <div className="slider-container-box">
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={rating || 4}
              onChange={(e) => onRatingChange(parseInt(e.target.value, 10))}
              className="emoji-range-input"
            />
            <div className="slider-labels">
              <span>😴 Cozy</span>
              <span>🙂 Great</span>
              <span>😍 Unforgettable!</span>
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

        .loc-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .open-maps-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 700;
          color: var(--color-sea);
          background-color: var(--tint-sea);
          padding: 4px 10px;
          border-radius: 9999px;
          text-decoration: none;
          transition: opacity 0.2s;
        }

        .open-maps-link:hover {
          opacity: 0.8;
          text-decoration: underline;
        }

        .osm-map-wrapper {
          width: 100%;
          height: 240px;
          border-radius: 20px;
          overflow: hidden;
          position: relative;
          background-color: #eef4fb;
          border: 1px solid var(--color-surface-container-high);
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05);
        }

        :global(.mini-map-loading) {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background-color: var(--color-surface-container-low);
          color: var(--color-text-muted);
          font-size: 13px;
          font-weight: 600;
        }

        :global(.spin) {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .no-coords-map-placeholder {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: linear-gradient(135deg, var(--tint-sea), var(--tint-butter));
          padding: 20px;
          text-align: center;
        }

        .no-coords-title {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 16px;
          color: var(--color-text);
        }

        .no-coords-addr {
          font-size: 13px;
          color: var(--color-text-muted);
        }

        .location-info-footer {
          margin-top: 14px;
        }

        .loc-main-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        :global(.loc-footer-pin) {
          color: var(--color-blush);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .loc-text-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .loc-footer-name {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 15px;
          color: var(--color-text);
        }

        .loc-footer-address {
          font-size: 13px;
          color: var(--color-text-muted);
          line-height: 1.4;
        }

        h3 {
          font-size: 18px;
          color: var(--color-text);
          margin: 0;
        }

        .desc-text {
          font-size: 15px;
          color: var(--color-text-muted);
          line-height: 1.5;
          margin: 8px 0 0 0;
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
      `}</style>
    </div>
  )
}
