import React, { useState, useEffect, useMemo, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import useSWR from 'swr'
import Layout from '../components/Layout'
import { MapPin, Calendar, ArrowRight, ChevronDown, RefreshCw, Users, Check } from 'lucide-react'
import { formatDate } from '../lib/format'
import { getHangoutUrl } from '../lib/hangoutUrl'
import { HangoutPin } from '../components/MapComponent'
import { Group } from '../components/groups/types'

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

type DateFilterType = 'All Time' | 'This Month' | 'This Year' | 'Memories'

export default function GroupMap() {
  const { data: pinsData, isLoading: loadingPins } = useSWR<HangoutPin[]>('/hangouts/map')
  const { data: groupsData, isLoading: loadingGroups } = useSWR<Group[]>('/groups')
  const pins = pinsData || []
  const groups = groupsData || []

  const [selectedPin, setSelectedPin] = useState<HangoutPin | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all')
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilterType>('All Time')

  const [showGroupDropdown, setShowGroupDropdown] = useState(false)
  const [showDateDropdown, setShowDateDropdown] = useState(false)

  const groupDropdownRef = useRef<HTMLDivElement>(null)
  const dateDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (groupDropdownRef.current && !groupDropdownRef.current.contains(e.target as Node)) {
        setShowGroupDropdown(false)
      }
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target as Node)) {
        setShowDateDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  // Filter pins dynamically by group and date
  const filteredPins = useMemo(() => {
    return pins.filter((pin) => {
      if (selectedGroupId !== 'all' && pin.group_id && pin.group_id !== selectedGroupId) {
        return false
      }
      if (selectedDateFilter !== 'All Time' && pin.hangout_date) {
        const pinDate = new Date(pin.hangout_date)
        const now = new Date()
        if (selectedDateFilter === 'This Month') {
          const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
          if (!pin.hangout_date.startsWith(currentYM)) return false
        } else if (selectedDateFilter === 'This Year') {
          if (pinDate.getFullYear() !== now.getFullYear()) return false
        } else if (selectedDateFilter === 'Memories') {
          if (pinDate.getFullYear() >= now.getFullYear()) return false
        }
      }
      return true
    })
  }, [pins, selectedGroupId, selectedDateFilter])

  // Maintain valid selected pin selection
  useEffect(() => {
    if (filteredPins.length > 0) {
      if (!selectedPin || !filteredPins.some((p) => p.id === selectedPin.id)) {
        setSelectedPin(filteredPins[0])
      }
    } else {
      setSelectedPin(null)
    }
  }, [filteredPins, selectedPin])

  const selectedGroupName =
    selectedGroupId === 'all'
      ? 'All Groups'
      : groups.find((g) => g.id === selectedGroupId)?.name || 'Group'

  const loading = loadingPins || loadingGroups

  return (
    <Layout>
      <Head>
        <title>Interactive Map | Hangout</title>
      </Head>

      <div className="map-page-container">
        {/* Interactive OpenStreetMap Canvas */}
        <div className="map-canvas-container">
          {/* Floating Filter Controls Overlay */}
          <div className="map-filter-bar">
            {/* Group Filter Dropdown */}
            <div className="filter-select-wrapper" ref={groupDropdownRef}>
              <button
                className={`filter-btn ${showGroupDropdown ? 'open' : ''} ${selectedGroupId !== 'all' ? 'active' : ''}`}
                onClick={() => {
                  setShowGroupDropdown(!showGroupDropdown)
                  setShowDateDropdown(false)
                }}
                type="button"
                aria-label="Filter by group"
              >
                <Users size={14} className="filter-icon" />
                <span className="filter-btn-text">{selectedGroupName}</span>
                <ChevronDown size={14} className={`chevron-icon ${showGroupDropdown ? 'rotate' : ''}`} />
              </button>

              {showGroupDropdown && (
                <div className="filter-dropdown">
                  <div
                    className={`dropdown-item ${selectedGroupId === 'all' ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedGroupId('all')
                      setShowGroupDropdown(false)
                    }}
                  >
                    <span>All Groups</span>
                    {selectedGroupId === 'all' && <Check size={14} className="check-icon" />}
                  </div>
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      className={`dropdown-item ${selectedGroupId === group.id ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedGroupId(group.id)
                        setShowGroupDropdown(false)
                      }}
                    >
                      <span>{group.name}</span>
                      {selectedGroupId === group.id && <Check size={14} className="check-icon" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Date Filter Dropdown */}
            <div className="filter-select-wrapper" ref={dateDropdownRef}>
              <button
                className={`filter-btn ${showDateDropdown ? 'open' : ''} ${selectedDateFilter !== 'All Time' ? 'active' : ''}`}
                onClick={() => {
                  setShowDateDropdown(!showDateDropdown)
                  setShowGroupDropdown(false)
                }}
                type="button"
                aria-label="Filter by date"
              >
                <Calendar size={14} className="filter-icon" />
                <span className="filter-btn-text">{selectedDateFilter}</span>
                <ChevronDown size={14} className={`chevron-icon ${showDateDropdown ? 'rotate' : ''}`} />
              </button>

              {showDateDropdown && (
                <div className="filter-dropdown">
                  {(['All Time', 'This Month', 'This Year', 'Memories'] as DateFilterType[]).map((option) => (
                    <div
                      key={option}
                      className={`dropdown-item ${selectedDateFilter === option ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedDateFilter(option)
                        setShowDateDropdown(false)
                      }}
                    >
                      <span>{option}</span>
                      {selectedDateFilter === option && <Check size={14} className="check-icon" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {loading && (
              <div className="loading-chip">
                <RefreshCw size={13} className="spin" />
                <span>Loading pins...</span>
              </div>
            )}
          </div>

          <MapComponent
            pins={filteredPins}
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
                    src={selectedPin.cover_photo_url || '/images/covers/hangout-default.jpg'}
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
                  <Link href={getHangoutUrl(selectedPin)} className="view-link">
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
        }

        .map-filter-bar {
          position: absolute;
          top: 16px;
          left: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 1000;
          flex-wrap: wrap;
        }

        .filter-select-wrapper {
          position: relative;
        }

        .filter-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 16px;
          border-radius: 9999px;
          border: 1px solid var(--color-surface-container-high);
          background: var(--nav-backdrop-bg);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 4px 16px rgba(46, 42, 40, 0.12);
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 13px;
          color: var(--color-text);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-btn:hover {
          background: var(--color-surface-container-lowest);
          box-shadow: 0 6px 20px rgba(46, 42, 40, 0.16);
          transform: translateY(-1px);
        }

        .filter-btn.open,
        .filter-btn.active {
          border-color: var(--color-tangerine);
          color: var(--color-text);
        }

        .filter-icon {
          color: var(--color-tangerine);
        }

        .filter-btn-text {
          max-width: 140px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .chevron-icon {
          color: var(--color-text-muted);
          transition: transform 0.2s ease;
        }

        .chevron-icon.rotate {
          transform: rotate(180deg);
        }

        .filter-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          background: var(--color-surface-container-lowest);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: 16px;
          box-shadow: 0 12px 32px rgba(46, 42, 40, 0.18);
          border: 1px solid var(--color-surface-container-high);
          padding: 6px;
          min-width: 180px;
          max-height: 240px;
          overflow-y: auto;
          z-index: 1010;
          animation: dropdownFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 12px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          color: var(--color-text-muted);
          transition: all 0.15s ease;
        }

        .dropdown-item:hover {
          background-color: var(--color-surface-container);
          color: var(--color-text);
        }

        .dropdown-item.selected {
          background-color: var(--tint-butter);
          color: var(--color-text);
          font-weight: 700;
        }

        .check-icon {
          color: var(--color-tangerine);
          margin-left: 8px;
          flex-shrink: 0;
        }

        .loading-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 9999px;
          background: var(--nav-backdrop-bg);
          backdrop-filter: blur(8px);
          border: 1px solid var(--color-surface-container-high);
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 12px;
          color: var(--color-text-muted);
          box-shadow: 0 4px 12px rgba(46, 42, 40, 0.08);
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
          background-color: var(--color-surface-container-low);
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
          background-color: var(--color-surface-container-low);
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
