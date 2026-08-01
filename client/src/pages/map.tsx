import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../components/Layout'
import { MapPin, Calendar, Heart, ArrowRight, Filter, ChevronDown } from 'lucide-react'

const hangoutsOnMap = [
  {
    id: '1',
    title: 'Friday Night Ramen',
    date: '2025-07-29',
    location: 'Ramen Nagi, BGC',
    coverImage: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=150&q=80',
    type: 'older', // Sea colored ring
    x: 280, // coordinates on our custom stylized map SVG
    y: 190,
  },
  {
    id: '2',
    title: 'Beach Day Picnic',
    date: '2026-07-15',
    location: 'Anawangin Cove',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=150&q=80',
    type: 'recent', // Blush colored ring
    x: 120,
    y: 110,
  },
  {
    id: '3',
    title: 'Coffee & Boardgames',
    date: '2026-07-26',
    location: 'Wildflour Cafe',
    coverImage: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=150&q=80',
    type: 'recent', // Blush colored ring
    x: 310,
    y: 160,
  }
]

export default function GroupMap() {
  const [selectedPin, setSelectedPin] = useState<typeof hangoutsOnMap[0] | null>(hangoutsOnMap[0])
  const [filterGroup, setFilterGroup] = useState('College Barkada')
  const [showDropdown, setShowDropdown] = useState(false)

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
        </div>

        {/* Map View Canvas (Stylized Vector Map matching the Brand colors) */}
        <div className="map-canvas-container">
          <svg viewBox="0 0 500 350" className="stylized-map-svg" xmlns="http://www.w3.org/2000/svg">
            {/* Background Sea (Sea tone) */}
            <rect width="500" height="350" rx="24" fill="#e6f0fa" />

            {/* Landmass 1 (Butter tone) */}
            <path d="M50,40 Q150,20 220,90 T350,110 T450,280 L480,330 L20,330 Z" fill="#fcf1d3" opacity="0.9" />
            
            {/* Landmass 2 (Warm Cream tone) */}
            <path d="M300,50 Q380,80 440,40 T480,200 L500,350 L200,350 Z" fill="#fff8f5" opacity="0.75" />

            {/* Minor decorative roads/paths */}
            <path d="M50,330 Q200,200 310,160 T480,40" fill="none" stroke="#e9e1dd" strokeWidth="6" strokeLinecap="round" />
            <path d="M120,110 Q280,190 310,160" fill="none" stroke="#e9e1dd" strokeWidth="4" strokeLinecap="round" strokeDasharray="5,5" />

            {/* Custom Pins */}
            {hangoutsOnMap.map((pin) => {
              const isSelected = selectedPin?.id === pin.id
              const ringColor = pin.type === 'recent' ? 'var(--color-blush)' : 'var(--color-sea)'
              
              return (
                <g 
                  key={pin.id} 
                  transform={`translate(${pin.x}, ${pin.y})`} 
                  className={`map-pin-group ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedPin(pin)}
                >
                  {/* Pin Drop Shadow */}
                  <ellipse cx="0" cy="12" rx="10" ry="4" fill="rgba(46, 42, 40, 0.15)" />
                  
                  {/* Pin teardrop body */}
                  <path 
                    d="M-18,-36 A 18 18 0 0 1 18,-36 C 18,-18 0,10 0,10 C 0,10 -18,-18 -18,-36 Z" 
                    fill="white" 
                    stroke={isSelected ? 'var(--color-tangerine)' : ringColor}
                    strokeWidth={isSelected ? '3.5' : '2.5'} 
                  />

                  {/* Image/Icon Inset */}
                  <defs>
                    <clipPath id={`avatarClip-${pin.id}`}>
                      <circle cx="0" cy="-36" r="14" />
                    </clipPath>
                  </defs>
                  
                  <image 
                    href={pin.coverImage} 
                    x="-14" 
                    y="-50" 
                    width="28" 
                    height="28" 
                    clipPath={`url(#avatarClip-${pin.id})`}
                    preserveAspectRatio="xMidYMid slice"
                  />
                  
                  {/* Pulse Ring for Selected */}
                  {isSelected && (
                    <circle cx="0" cy="-36" r="20" stroke="var(--color-tangerine)" strokeWidth="2" fill="none" className="pulse-ring" />
                  )}
                </g>
              )
            })}
          </svg>

          {/* Draggable/Animated Place Preview Card */}
          {selectedPin && (
            <div className="place-preview-card">
              <div className="preview-card-drag-bar" />
              <div className="preview-card-body">
                <div className="preview-image-box">
                  <img src={selectedPin.coverImage} alt={selectedPin.title} />
                </div>
                <div className="preview-info-box">
                  <span className="preview-date">
                    {new Date(selectedPin.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <h4>{selectedPin.title}</h4>
                  <div className="preview-location">
                    <MapPin size={14} className="loc-pin" />
                    <span>{selectedPin.location}</span>
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
          display: flex;
          gap: 12px;
          z-index: 100;
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
          box-shadow: 0 10px 25px rgba(0,0,0,0.08);
          border: 1px solid var(--color-surface-container-high);
          overflow: hidden;
          width: 180px;
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

        .date-chip {
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

        /* Map Canvas */
        .map-canvas-container {
          flex: 1;
          position: relative;
          border-radius: 28px;
          overflow: hidden;
          box-shadow: var(--shadow-ambient);
          border: 1px solid var(--color-surface-container-high);
          background-color: #e6f0fa;
        }

        .stylized-map-svg {
          width: 100%;
          height: 100%;
          display: block;
        }

        .map-pin-group {
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .map-pin-group:hover {
          transform: translate(${props => props.x}px, ${props => props.y}px) scale(1.15);
        }

        .pulse-ring {
          animation: pulse 1.5s infinite;
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
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
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

        @keyframes pulse {
          0% { r: 14; opacity: 1; }
          100% { r: 24; opacity: 0; }
        }

        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        /* Desktop specific layout rules */
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
