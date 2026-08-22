import React, { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../components/Layout'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { formatDate } from '../lib/format'
import {
  MapPin,
  Calendar,
  Heart,
  X,
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
  Loader2,
} from 'lucide-react'
import { Avatar, AvatarStack, EmptyState, SearchInput, Button } from '../components/ui'

interface ParticipantProfile {
  id: string
  username: string
  email: string
  avatar_url?: string | null
}

interface Participant {
  id: string
  hangout_id: string
  user_id: string
  profile?: ParticipantProfile | null
}

interface Hangout {
  id: string
  title: string
  description?: string | null
  hangout_date: string
  hangout_time?: string | null
  location_name?: string | null
  latitude?: number | null
  longitude?: number | null
  cover_photo_url?: string | null
  group_id?: string | null
  created_by: string
  created_at: string
  updated_at: string
  creator?: ParticipantProfile | null
  participants?: Participant[]
}

interface Memory extends Hangout {
  years_ago: number
}

interface Group {
  id: string
  name: string
  description?: string | null
  cover_image_url?: string | null
}

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80'

export default function Timeline() {
  const { user } = useAuth()
  const [hangoutsList, setHangoutsList] = useState<Hangout[]>([])
  const [groupsList, setGroupsList] = useState<Group[]>([])
  const [memory, setMemory] = useState<Memory | null>(null)
  const [showMemory, setShowMemory] = useState(true)
  const [loadingHangouts, setLoadingHangouts] = useState(true)

  // Granular Filter queries
  const [searchQuery, setSearchQuery] = useState('')
  const [hangoutNameQuery, setHangoutNameQuery] = useState('')
  const [locationNameQuery, setLocationNameQuery] = useState('')
  const [dateQuery, setDateQuery] = useState('')
  const [groupNameQuery, setGroupNameQuery] = useState('')
  // Quick Preset Filter: 'All' | 'This Month' | 'Memories'
  const [activeQuickFilter, setActiveQuickFilter] = useState<'All' | 'This Month' | 'Memories'>('All')
  const [showFilterDrawer, setShowFilterDrawer] = useState(false)

  const quickFilterOptions: Array<{ label: 'All' | 'This Month' | 'Memories'; color: string }> = [
    { label: 'All', color: 'var(--color-blush)' },
    { label: 'This Month', color: 'var(--color-tangerine)' },
    { label: 'Memories', color: 'var(--color-matcha)' },
  ]

  const activeFiltersCount =
    (hangoutNameQuery ? 1 : 0) +
    (locationNameQuery ? 1 : 0) +
    (dateQuery ? 1 : 0) +
    (groupNameQuery ? 1 : 0)

  const fetchHangouts = useCallback(async () => {
    try {
      setLoadingHangouts(true)
      const params = new URLSearchParams()

      if (searchQuery.trim()) {
        params.set('q', searchQuery.trim())
      }
      if (hangoutNameQuery.trim()) {
        params.set('hangout_name', hangoutNameQuery.trim())
      }
      if (locationNameQuery.trim()) {
        params.set('location_name', locationNameQuery.trim())
      }
      if (dateQuery) {
        params.set('date', dateQuery)
      }
      if (groupNameQuery.trim()) {
        params.set('group_name', groupNameQuery.trim())
      }

      const queryStr = params.toString() ? `?${params.toString()}` : ''
      const data = await api.get<Hangout[]>(`/hangouts${queryStr}`)
      setHangoutsList(data || [])
    } catch (err) {
      console.error('Failed to fetch hangouts:', err)
      setHangoutsList([])
    } finally {
      setLoadingHangouts(false)
    }
  }, [searchQuery, hangoutNameQuery, locationNameQuery, dateQuery, groupNameQuery])

  const fetchMemories = async () => {
    try {
      const data = await api.get<Memory[]>('/memories/on-this-day')
      if (data && data.length > 0) {
        setMemory(data[0])
      } else {
        setMemory(null)
      }
    } catch (err) {
      console.error('Failed to fetch memories:', err)
      setMemory(null)
    }
  }

  const fetchGroups = async () => {
    try {
      const data = await api.get<Group[]>('/groups')
      setGroupsList(data || [])
    } catch (err) {
      console.error('Failed to fetch groups:', err)
    }
  }

  useEffect(() => {
    fetchGroups()
    fetchMemories()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHangouts()
    }, 250)
    return () => clearTimeout(timer)
  }, [fetchHangouts])

  const handleResetFilters = () => {
    setSearchQuery('')
    setHangoutNameQuery('')
    setLocationNameQuery('')
    setDateQuery('')
    setGroupNameQuery('')
    setActiveQuickFilter('All')
  }

  const displayedHangouts = hangoutsList.filter((h) => {
    if (activeQuickFilter === 'This Month') {
      const now = new Date()
      const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      return h.hangout_date.startsWith(currentYM)
    }
    if (activeQuickFilter === 'Memories') {
      const now = new Date()
      const hDate = new Date(h.hangout_date)
      return hDate.getFullYear() < now.getFullYear()
    }
    if (dateQuery.trim()) {
      return h.hangout_date.includes(dateQuery.trim())
    }
    return true
  })

  const userAvatar = user?.avatar_url || 'https://api.dicebear.com/7.x/adventurer/svg?seed=Mika'
  const userName = user?.username || 'User'

  return (
    <ProtectedRoute>
      <Layout>
        <Head>
          <title>Timeline | Hangout</title>
        </Head>

        <div className="timeline-page">
          {/* Top Header */}
          <header className="timeline-header">
            <div className="header-greeting">
              <h2>Hello, {userName} 👋</h2>
              <p className="subtitle">
                {groupsList.length > 0
                  ? `${groupsList.length} active group${groupsList.length > 1 ? 's' : ''}`
                  : 'Welcome to your hangout scrapbook'}
              </p>
            </div>
            <div className="header-avatar">
              <Avatar src={userAvatar} alt={userName} size={52} />
            </div>
          </header>

          {/* Search & Filter Controls */}
          <div className="search-section">
            <div className="search-row">
              <div className="search-input-wrapper">
                <SearchInput
                  placeholder="Search hangouts, places, notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  inputClassName="pill-input-butter"
                />
              </div>
              <button
                className={`filter-toggle-btn ${showFilterDrawer || activeFiltersCount > 0 ? 'active' : ''}`}
                onClick={() => setShowFilterDrawer(!showFilterDrawer)}
                title="Toggle granular filter inputs"
              >
                <SlidersHorizontal size={18} />
                <span>Filters</span>
                {activeFiltersCount > 0 && <span className="active-badge">{activeFiltersCount}</span>}
              </button>
            </div>

            {/* Granular Query Filters Drawer */}
            {showFilterDrawer && (
              <div className="granular-filters-card">
                <div className="filters-grid">
                  <div className="filter-field">
                    <label>Hangout Name</label>
                    <input
                      type="text"
                      className="pill-input"
                      placeholder="e.g. Ramen Night"
                      value={hangoutNameQuery}
                      onChange={(e) => setHangoutNameQuery(e.target.value)}
                    />
                  </div>

                  <div className="filter-field">
                    <label>Location</label>
                    <input
                      type="text"
                      className="pill-input"
                      placeholder="e.g. BGC or Cafe"
                      value={locationNameQuery}
                      onChange={(e) => setLocationNameQuery(e.target.value)}
                    />
                  </div>

                  <div className="filter-field">
                    <label>Date</label>
                    <input
                      type="text"
                      className="pill-input date-input"
                      placeholder="e.g. 2026-08 or 2026"
                      value={dateQuery}
                      onChange={(e) => setDateQuery(e.target.value)}
                    />
                  </div>

                  <div className="filter-field">
                    <label>Group</label>
                    <select
                      className="pill-input select-input"
                      value={groupNameQuery}
                      onChange={(e) => setGroupNameQuery(e.target.value)}
                    >
                      <option value="">All Groups</option>
                      {groupsList.map((grp) => (
                        <option key={grp.id} value={grp.name}>
                          {grp.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {(searchQuery || hangoutNameQuery || locationNameQuery || dateQuery || groupNameQuery || activeQuickFilter !== 'All') && (
                  <div className="filter-reset-row">
                    <button className="reset-link" onClick={handleResetFilters}>
                      <RotateCcw size={14} />
                      <span>Clear all filters</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Preset Filter Chips Row */}
          <div className="filters-section">
            <div className="filter-chips-row">
              {quickFilterOptions.map((opt) => (
                <button
                  key={opt.label}
                  className={`filter-chip ${activeQuickFilter === opt.label ? 'active' : ''}`}
                  onClick={() => setActiveQuickFilter(opt.label)}
                  style={{ '--chip-color': opt.color } as React.CSSProperties}
                >
                  <span className="chip-indicator" />
                  <span className="chip-label">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* "On This Day" Memory Hero Card */}
          {showMemory && memory && activeQuickFilter === 'All' && !searchQuery && (
            <div className="memory-banner-card">
              <button
                className="dismiss-memory"
                onClick={() => setShowMemory(false)}
                title="Dismiss memory banner"
              >
                <X size={18} />
              </button>
              <div className="memory-banner-content">
                <div className="memory-banner-text">
                  <div className="memory-tag">
                    <Heart size={16} fill="white" />
                    <span>
                      {memory.years_ago === 1
                        ? 'One year ago today...'
                        : `${memory.years_ago} years ago today...`}
                    </span>
                  </div>
                  <h3>{memory.title}</h3>
                  {memory.location_name && (
                    <p className="memory-loc">
                      <MapPin size={14} /> {memory.location_name}
                    </p>
                  )}
                  <Link
                    href={`/hangout/${memory.id}`}
                    className="pill-button pill-button-primary memory-cta"
                  >
                    <Sparkles size={16} /> Relive this memory
                  </Link>
                </div>
                <div className="memory-banner-polaroid">
                  <div className="polaroid-inset">
                    <img src={memory.cover_photo_url || DEFAULT_COVER} alt={memory.title} />
                    <div className="polaroid-caption">{memory.title}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timeline Feed List */}
          <div className="timeline-feed">
            <div className="feed-title-row">
              <h3>Recent Hangouts</h3>
              <span className="feed-count">
                {loadingHangouts
                  ? 'Loading...'
                  : `${displayedHangouts.length} entr${displayedHangouts.length === 1 ? 'y' : 'ies'}`}
              </span>
            </div>

            {loadingHangouts ? (
              <div className="loading-state-card">
                <Loader2 size={32} className="spin-icon" />
                <p>Gathering memories...</p>
              </div>
            ) : displayedHangouts.length === 0 ? (
              <div className="empty-state-wrapper">
                <EmptyState
                  variant="card"
                  icon={<Sparkles size={48} />}
                  title="No hangouts found"
                  description="Try refining your search query or create a new hangout meetup with your crew."
                />
                <div className="create-hangout-cta">
                  <Link href="/create">
                    <Button variant="primary">Create a Hangout</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="hangout-cards-grid">
                {displayedHangouts.map((h, idx) => {
                  const rotationDeg = ((idx % 5) - 2) * 1.5
                  const participantsList = h.participants || []
                  const avatarStackItems = participantsList.map((p, pIdx) => ({
                    src:
                      p.profile?.avatar_url ||
                      `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(
                        p.profile?.username || `Member${pIdx}`
                      )}`,
                    alt: p.profile?.username || 'Member',
                  }))

                  return (
                    <Link href={`/hangout/${h.id}`} key={h.id} className="hangout-card-link">
                      <div
                        className="polaroid-card hangout-card"
                        style={{
                          '--hover-rotate': `${rotationDeg * 1.5}deg`,
                          transform: `rotate(${rotationDeg * 0.6}deg)`,
                        } as React.CSSProperties}
                      >
                        <div className="polaroid-image-container">
                          <img
                            src={h.cover_photo_url || DEFAULT_COVER}
                            className="polaroid-image"
                            alt={h.title}
                          />
                          <div className="date-badge">
                            <Calendar size={12} />
                            <span>{formatDate(h.hangout_date)}</span>
                          </div>
                        </div>
                        <div className="card-info">
                          <h4 className="card-title">{h.title}</h4>
                          {h.description && <p className="card-desc">{h.description}</p>}
                          <div className="card-footer">
                            <div className="card-location">
                              <MapPin size={14} />
                              <span>{h.location_name || 'Somewhere fun'}</span>
                            </div>
                            {avatarStackItems.length > 0 && (
                              <AvatarStack size={28} overlap={8} avatars={avatarStackItems} />
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          .timeline-page {
            max-width: 800px;
            margin: 0 auto;
          }

          .timeline-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
          }

          .header-greeting h2 {
            font-size: 28px;
            font-family: var(--font-display);
          }

          .subtitle {
            font-size: 14px;
            color: var(--color-text-muted);
          }

          .search-section {
            margin-bottom: 24px;
          }

          .search-row {
            display: flex;
            gap: 12px;
            align-items: center;
          }

          .search-input-wrapper {
            flex: 1;
          }

          .filter-toggle-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 12px 18px;
            border-radius: 9999px;
            border: 1px solid var(--color-surface-container-high);
            background-color: var(--color-surface-container-lowest);
            color: var(--color-text);
            font-family: var(--font-display);
            font-weight: 700;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
            white-space: nowrap;
          }

          .filter-toggle-btn:hover {
            background-color: var(--color-surface-container-low);
          }

          .filter-toggle-btn.active {
            border-color: var(--color-blush);
            color: var(--color-blush);
            background-color: var(--tint-blush);
          }

          .active-badge {
            background-color: var(--color-blush);
            color: white;
            border-radius: 50%;
            width: 18px;
            height: 18px;
            font-size: 11px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .granular-filters-card {
            background-color: var(--color-surface-container-lowest);
            border: 1px solid var(--color-surface-container-high);
            border-radius: 20px;
            padding: 20px;
            margin-top: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          }

          .filters-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 16px;
          }

          .filter-field {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .filter-field label {
            font-size: 12px;
            font-weight: 700;
            color: var(--color-text-muted);
            font-family: var(--font-display);
          }

          .filter-field .pill-input {
            width: 100%;
            padding: 8px 14px;
            font-size: 13px;
            border-radius: 9999px;
            border: 1px solid var(--color-outline-variant);
            background-color: var(--color-surface-container-low);
          }

          .filter-field .date-input {
            padding-right: 12px;
          }

          .filter-field select.pill-input {
            cursor: pointer;
          }

          .filter-reset-row {
            margin-top: 14px;
            display: flex;
            justify-content: flex-end;
          }

          .reset-link {
            background: none;
            border: none;
            color: var(--color-blush);
            font-size: 12px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
          }

          .reset-link:hover {
            text-decoration: underline;
          }

          .filters-section {
            margin-bottom: 32px;
          }

          .filter-chips-row {
            display: flex;
            gap: 12px;
            overflow-x: auto;
            padding: 4px 0;
            scrollbar-width: none;
          }

          .filter-chips-row::-webkit-scrollbar {
            display: none;
          }

          .filter-chip {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 18px;
            border-radius: 9999px;
            border: 1px solid var(--color-surface-container-high);
            background-color: var(--color-surface-container-lowest);
            cursor: pointer;
            transition: all 0.2s ease;
            font-family: var(--font-display);
            font-weight: 700;
            font-size: 14px;
            color: var(--color-text-muted);
            white-space: nowrap;
          }

          .chip-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: var(--chip-color);
          }

          .filter-chip:hover {
            background-color: var(--color-surface-container-low);
          }

          .filter-chip.active {
            background-color: var(--chip-color);
            color: white;
            border-color: var(--chip-color);
          }

          .filter-chip.active .chip-indicator {
            background-color: white;
          }

          /* On This Day Memory Card */
          .memory-banner-card {
            position: relative;
            background: linear-gradient(135deg, #e36888 0%, #f08c21 100%);
            border-radius: 28px;
            padding: 24px;
            margin-bottom: 40px;
            box-shadow: var(--shadow-ambient);
            overflow: hidden;
            color: white;
          }

          .dismiss-memory {
            position: absolute;
            top: 16px;
            right: 16px;
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background 0.2s;
            z-index: 10;
          }

          .dismiss-memory:hover {
            background: rgba(255, 255, 255, 0.3);
          }

          .memory-banner-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 24px;
          }

          .memory-banner-text {
            flex: 1;
          }

          .memory-tag {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-family: var(--font-display);
            font-weight: 700;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            background-color: rgba(255, 255, 255, 0.2);
            padding: 6px 12px;
            border-radius: 9999px;
            margin-bottom: 12px;
          }

          .memory-banner-text h3 {
            font-size: 28px;
            color: white;
            margin-bottom: 8px;
            line-height: 1.2;
          }

          .memory-loc {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 20px;
          }

          .memory-cta {
            border: 1.5px solid white;
            background: transparent;
            color: white;
            font-size: 14px;
            padding: 10px 20px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            text-decoration: none;
          }

          .memory-cta:hover {
            background: white;
            color: var(--color-blush);
          }

          .memory-banner-polaroid {
            flex-shrink: 0;
            transform: rotate(4deg);
          }

          .polaroid-inset {
            background-color: white;
            padding: 8px 8px 20px 8px;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            width: 140px;
          }

          .polaroid-inset img {
            width: 124px;
            height: 94px;
            object-fit: cover;
            border-radius: 4px;
          }

          .polaroid-caption {
            font-family: var(--font-display);
            font-size: 11px;
            color: var(--color-text);
            text-align: center;
            margin-top: 8px;
            font-weight: 700;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          /* Timeline Feed Grid */
          .feed-title-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }

          .feed-count {
            font-size: 14px;
            color: var(--color-text-muted);
          }

          .loading-state-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            background-color: var(--color-surface-container-lowest);
            border-radius: 24px;
            gap: 12px;
            color: var(--color-text-muted);
          }

          .spin-icon {
            animation: spin 1s linear infinite;
            color: var(--color-tangerine);
          }

          .empty-state-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
          }

          .create-hangout-cta {
            margin-top: -8px;
          }

          .hangout-cards-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 28px;
          }

          .hangout-card-link {
            text-decoration: none;
          }

          .hangout-card {
            display: flex;
            flex-direction: column;
            gap: 12px;
            cursor: pointer;
          }

          .date-badge {
            position: absolute;
            top: 12px;
            left: 12px;
            background-color: var(--color-tangerine);
            color: white;
            padding: 6px 12px;
            border-radius: 9999px;
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            font-weight: 700;
            font-family: var(--font-display);
            box-shadow: 0 4px 10px rgba(240, 140, 33, 0.2);
          }

          .card-info {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 4px;
          }

          .card-title {
            font-size: 20px;
            font-family: var(--font-display);
            color: var(--color-text);
          }

          .card-desc {
            font-size: 14px;
            color: var(--color-text-muted);
            line-height: 1.4;
          }

          .card-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 8px;
          }

          .card-location {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            color: var(--color-text-muted);
            font-weight: 600;
          }

          @media (max-width: 580px) {
            .memory-banner-content {
              flex-direction: column-reverse;
              align-items: flex-start;
            }

            .memory-banner-polaroid {
              align-self: center;
              margin-bottom: 12px;
            }

            .filters-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </Layout>
    </ProtectedRoute>
  )
}

