import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import Layout from '../components/Layout'
import { MapPin, Calendar, ArrowRight, ChevronDown, RefreshCw } from 'lucide-react'
import { mapPins, hangoutById } from '../data/mock'
import { formatDate } from '../lib/format'
import { api } from '../lib/api'

interface HangoutPin {
  id: string
  title: string
  location_name?: string
  latitude: number
  longitude: number
  hangout_date: string
  cover_photo_url?: string
}

// Dynamically import OpenStreetMap Leaflet component (No SSR for Leaflet)
const MapComponent = dynamic(() => import('../components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="map-loading-placeholder">
      <RefreshCw size={24} className="spin" />
      <span>Loading OpenStreetMap...</span>
    </div>
  ),
})

// Fallback mock pins for demonstration if API coordinates are not populated
const fallbackPins: HangoutPin[] = mapPins.map((pin, idx) => {
  const h = hangoutById(pin.id)
  return {
    id: pin.id,
    title: h?.title || 'Group Hangout',
    location_name: h?.location || 'Manila',
    latitude: 14.5800 + (idx * 0.015),
    longitude: 120.9800 + (idx * 0.012),
    hangout_date: h?.date || '2026-08-10',
    cover_photo_url: h?.coverImage || 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=500&auto=format&fit=crop&q=60',
  }
})

export default function GroupMap() {
  const [pins, setPins] = useState<HangoutPin[]>(fallbackPins)
  const [selectedPin, setSelectedPin] = useState<HangoutPin | null>(fallbackPins[0])
  const [filterGroup, setFilterGroup] = useState('College Barkada')
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchMapPins()
  }, [filterGroup])

  const fetchMapPins = async () => {
    setLoading(true)
    try {
      const data = await api.get<HangoutPin[]>('/hangouts/map')
      if (data && data.length > 0) {
        setPins(data)
        setSelectedPin(data[0])
      } else {
        setPins(fallbackPins)
      }
    } catch (err) {
      console.warn('Backend map endpoint unavailable, using mock pin data:', err)
      setPins(fallbackPins)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <Head>
        <title>Interactive Map | Hangout</title>
      </Head>

      <div className="map-page-container">
        {/* Top Floating Filter Bar */}
        <div className="map-filter-bar">
          <div className="filter-select-wrapper">
            <button className="filter-btn" onClick={() => setShowDropdown(!showDropdown)}>
              <span>{filterGroup}</span>
              <ChevronDown size={16} />
            </button>

            {showDropdown && (
              <div className="filter-dropdown">
                <div className="dropdown-item" onClick={() => { setFilterGroup('College Barkada'); setShowDropdown(false); }}>College Barkada</div>
                <div className="dropdown-item" onClick={() => { setFilterGroup('Weekend Warriors'); setShowDropdown(false); }}>Weekend Warriors</div>
                <div className="dropdown-item" onClick={() => { setFilterGroup('All Groups'); setShowDropdown(false); }}>All Groups</div>
              </div>
            )}
          </div>

          <div className="date-chip">
            <Calendar size={14} />
            <span>All Time</span>
          </div>

          {loading && (
            <div className="loading-chip">
              <RefreshCw size={14} className="spin" />
              <span>Loading pins...</span>
            </div>
          )}
        </div>

        {/* Interactive OpenStreetMap Canvas */}
        <div className="map-canvas-container">
          <MapComponent
            pins={pins}
            selectedPin={selectedPin}
            onSelectPin={(pin) => setSelectedPin(pin)}
            center={[14.5995, 120.9842]}
            zoom={12}
          />

          {/* Place Preview Card */}
          {selectedPin && (
            <div className="place-preview-card">
              <div className="preview-card-drag-bar" />
              <div className="preview-card-body">
                <div className="preview-image-box">
                  <img
                    src={selectedPin.cover_photo_url || 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=500&auto=format&fit=crop&q=60'}
                    alt={selectedPin.title}
                  />
                </div>
                <div className="preview-info-box">
                  <span className="preview-date">
                    {formatDate(selectedPin.hangout_date)}
                  </span>
                  <h4>{selectedPin.title}</h4>
                  <div className="preview-location">
                    <MapPin size={14} className="loc-pin" />
                    <span>{selectedPin.location_name || 'Manila'}</span>
                  </div>
                  <Link href={`/hangout/${selectedPin.id}`} className="view-link">
                    <span>View Hangout</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .map-page-container {
          position: relative;
          height: calc(100vh - 120px);
          max-height: 700px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .map-filter-bar {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 2000;
        }

        .filter-select-wrapper {
          position: relative;
        }

        .filter-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 9999px;
          border: 1px solid var(--color-surface-container-high);
          background-color: var(--color-surface-container-lowest);
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 14px;
          color: var(--color-text-muted);
          cursor: pointer;
        }

        .filter-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: 8px;
          background-color: var(--color-surface-container-lowest);
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.12);
          border: 1px solid var(--color-surface-container-high);
          overflow: hidden;
          width: 180px;
          z-index: 2010;
        }

        .dropdown-item {
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          color: var(--color-text-muted);
          transition: background 0.2s;
        }

        .dropdown-item:hover {
          background-color: var(--color-surface-container-low);
          color: var(--color-text);
        }

        .date-chip, .loading-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 9999px;
          background-color: var(--color-surface-container);
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 14px;
          color: var(--color-text-muted);
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Map Canvas */
        .map-canvas-container {
          flex: 1;
          position: relative;
          z-index: 1;
          border-radius: 28px;
          overflow: hidden;
          box-shadow: var(--shadow-ambient);
          border: 1px solid var(--color-surface-container-high);
          background-color: #e6f0fa;
        }

        .map-loading-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-family: var(--font-display);
          font-weight: 700;
          color: var(--color-text-muted);
          background-color: #e6f0fa;
        }

        /* Custom Leaflet Pin Markers */
        :global(.custom-leaflet-marker-wrapper) {
          background: transparent !important;
          border: none !important;
        }

        :global(.custom-map-pin) {
          position: relative;
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        :global(.custom-map-pin:hover),
        :global(.custom-map-pin.selected) {
          transform: scale(1.15);
          z-index: 10;
        }

        :global(.pin-avatar-ring) {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 3px solid var(--color-blush);
          background-color: white;
          overflow: hidden;
          box-shadow: 0 6px 16px rgba(0,0,0,0.18);
        }

        :global(.custom-map-pin.selected .pin-avatar-ring) {
          border-color: var(--color-tangerine);
          box-shadow: 0 8px 24px rgba(242, 114, 89, 0.4);
        }

        :global(.pin-avatar) {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        :global(.pin-arrow) {
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid var(--color-blush);
          margin: -2px auto 0 auto;
        }

        :global(.custom-map-pin.selected .pin-arrow) {
          border-top-color: var(--color-tangerine);
        }

        /* Slide-up preview card */
        .place-preview-card {
          position: absolute;
          bottom: 20px;
          left: 20px;
          right: 20px;
          background-color: var(--color-surface-container-lowest);
          border-radius: 20px;
          padding: 16px;
          box-shadow: 0 15px 30px rgba(46, 42, 40, 0.15);
          border: 1px solid var(--color-surface-container-high);
          z-index: 1000;
        }

        .preview-card-drag-bar {
          width: 32px;
          height: 4px;
          background-color: var(--color-surface-container-high);
          border-radius: 2px;
          margin: 0 auto 12px auto;
        }

        .preview-card-body {
          display: flex;
          gap: 16px;
        }

        .preview-image-box {
          width: 80px;
          height: 80px;
          border-radius: 12px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .preview-image-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .preview-info-box {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .preview-date {
          font-size: 11px;
          font-weight: 700;
          color: var(--color-tangerine);
          text-transform: uppercase;
        }

        .preview-info-box h4 {
          font-size: 16px;
          font-family: var(--font-display);
        }

        .preview-location {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: var(--color-text-muted);
        }

        .loc-pin {
          color: var(--color-sea);
        }

        .view-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
          color: var(--color-sea);
          margin-top: 4px;
        }

        @media (min-width: 769px) {
          .place-preview-card {
            width: 320px;
            left: 20px;
            right: auto;
          }
        }
      `}</style>
    </Layout>
  )
}
