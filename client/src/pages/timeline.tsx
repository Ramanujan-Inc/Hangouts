import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../components/Layout'
import { Search, MapPin, Calendar, Heart, X, Sparkles, Filter } from 'lucide-react'

// Mock data representing friend roster
const members = {
  mika: { name: 'Mika', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=mika' },
  jam: { name: 'Jam', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=jam' },
  dave: { name: 'Dave', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=dave' },
  chloe: { name: 'Chloe', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=chloe' },
}

// Mock data for Hangouts
const initialHangouts = [
  {
    id: '1',
    title: 'Friday Night Ramen',
    description: 'Craving spicy tonkotsu ramen after a long week. Ended up talking for hours about trip planning.',
    date: '2025-07-29', // Exactly 1 year ago (assuming current date is July 2026)
    location: 'Ramen Nagi, BGC',
    coverImage: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
    participants: ['mika', 'jam', 'dave'],
    rating: 5,
    rotation: -1,
  },
  {
    id: '2',
    title: 'Beach Day Picnic',
    description: 'Road trip to the beach. Chloe brought her guitar and we set up a bonfire just before sunset.',
    date: '2026-07-15',
    location: 'Anawangin Cove',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    participants: ['mika', 'jam', 'dave', 'chloe'],
    rating: 5,
    rotation: 1.5,
  },
  {
    id: '3',
    title: 'Coffee & Boardgames',
    description: 'Trying out a new local coffee shop. Dave lost terribly at Settlers of Catan.',
    date: '2026-07-26',
    location: 'Wildflour Cafe',
    coverImage: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    participants: ['mika', 'dave'],
    rating: 4,
    rotation: -2,
  }
]

export default function Timeline() {
  const [hangouts, setHangouts] = useState(initialHangouts)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [showMemory, setShowMemory] = useState(true)

  const filterOptions = [
    { label: 'All', color: 'var(--color-blush)' },
    { label: 'This Month', color: 'var(--color-tangerine)' },
    { label: 'Nearby', color: 'var(--color-sea)' },
    { label: 'Memories', color: 'var(--color-matcha)' },
  ]

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase()
    setSearchQuery(query)
    filterHangouts(query, activeFilter)
  }

  const handleFilterClick = (filterLabel: string) => {
    setActiveFilter(filterLabel)
    filterHangouts(searchQuery, filterLabel)
  }

  const filterHangouts = (query: string, filter: string) => {
    let filtered = initialHangouts.filter(
      (h) =>
        h.title.toLowerCase().includes(query) ||
        h.location.toLowerCase().includes(query) ||
        h.description.toLowerCase().includes(query)
    )

    if (filter === 'This Month') {
      // July 2026
      filtered = filtered.filter((h) => h.date.startsWith('2026-07'))
    } else if (filter === 'Nearby') {
      filtered = filtered.filter((h) => h.location.includes('BGC') || h.location.includes('Wildflour'))
    } else if (filter === 'Memories') {
      filtered = filtered.filter((h) => h.date.startsWith('2025'))
    }

    setHangouts(filtered)
  }

  // Find memory from exactly 1 year ago (id = 1)
  const memoryHangout = initialHangouts.find(h => h.id === '1')

  return (
    <Layout>
      <Head>
        <title>Timeline | Hangout</title>
      </Head>

      <div className="timeline-page">
        {/* Top Header */}
        <header className="timeline-header">
          <div className="header-greeting">
            <h2>Hello, Mika 👋</h2>
            <p className="subtitle">College Barkada • 4 active members</p>
          </div>
          <div className="header-avatar">
            <img src={members.mika.avatar} alt="Mika" />
          </div>
        </header>

        {/* Search Bar */}
        <div className="search-section">
          <div className="search-bar-wrapper">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              className="pill-input-custom"
              placeholder="Search hangouts, places, notes..."
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
        </div>

        {/* Horizontal Quick Filter Row */}
        <div className="filters-section">
          <div className="filter-chips-row">
            {filterOptions.map((opt) => (
              <button
                key={opt.label}
                className={`filter-chip ${activeFilter === opt.label ? 'active' : ''}`}
                onClick={() => handleFilterClick(opt.label)}
                style={{ '--chip-color': opt.color } as React.CSSProperties}
              >
                <span className="chip-indicator" />
                <span className="chip-label">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* "On This Day" Memory Card */}
        {showMemory && memoryHangout && activeFilter === 'All' && (
          <div className="memory-banner-card">
            <button className="dismiss-memory" onClick={() => setShowMemory(false)}>
              <X size={18} />
            </button>
            <div className="memory-banner-content">
              <div className="memory-banner-text">
                <div className="memory-tag">
                  <Heart size={16} fill="white" />
                  <span>One year ago today...</span>
                </div>
                <h3>{memoryHangout.title}</h3>
                <p className="memory-loc">
                  <MapPin size={14} /> {memoryHangout.location}
                </p>
                <Link href={`/hangout/${memoryHangout.id}`} className="pill-button pill-button-primary memory-cta">
                  <Sparkles size={16} /> Relive this memory
                </Link>
              </div>
              <div className="memory-banner-polaroid">
                <div className="polaroid-inset">
                  <img src={memoryHangout.coverImage} alt={memoryHangout.title} />
                  <div className="polaroid-caption">{memoryHangout.title}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timeline main list */}
        <div className="timeline-feed">
          <div className="feed-title-row">
            <h3>Recent Hangouts</h3>
            <span className="feed-count">{hangouts.length} entries</span>
          </div>

          {hangouts.length === 0 ? (
            <div className="empty-state">
              <Sparkles size={48} className="empty-icon" />
              <h4>No hangouts found</h4>
              <p>Try refining your search query or add a new hangout meetup.</p>
            </div>
          ) : (
            <div className="hangout-cards-grid">
              {hangouts.map((h, idx) => (
                <Link href={`/hangout/${h.id}`} key={h.id} className="hangout-card-link">
                  <div
                    className="polaroid-card hangout-card"
                    style={{
                      '--hover-rotate': `${h.rotation}deg`,
                      transform: `rotate(${h.rotation * 0.5}deg)`,
                    } as React.CSSProperties}
                  >
                    <div className="polaroid-image-container">
                      <img src={h.coverImage} className="polaroid-image" alt={h.title} />
                      <div className="date-badge">
                        <Calendar size={12} />
                        <span>{new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                    <div className="card-info">
                      <h4 className="card-title">{h.title}</h4>
                      <p className="card-desc">{h.description}</p>
                      <div className="card-footer">
                        <div className="card-location">
                          <MapPin size={14} />
                          <span>{h.location}</span>
                        </div>
                        {/* Avatar stack */}
                        <div className="avatar-stack">
                          {h.participants.map((p, i) => (
                            <img
                              key={p}
                              src={members[p as keyof typeof members].avatar}
                              alt={p}
                              className="stack-avatar"
                              style={{ zIndex: 10 - i, transform: `translateX(-${i * 8}px)` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
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

        .header-avatar img {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background-color: var(--color-surface-container);
          border: 2px solid var(--color-outline-variant);
        }

        .search-section {
          margin-bottom: 24px;
        }

        .search-bar-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 18px;
          color: var(--color-text-muted);
        }

        .pill-input-custom {
          width: 100%;
          background-color: #f2d88f; /* Butter fill */
          color: var(--color-text);
          font-family: var(--font-body);
          padding: 14px 20px 14px 48px;
          border-radius: 9999px;
          outline: none;
          font-size: 16px;
          border: none;
          box-shadow: inset 0 2px 4px rgba(46, 42, 40, 0.08);
          font-weight: 600;
        }

        .pill-input-custom::placeholder {
          color: var(--color-text-muted);
          opacity: 0.8;
        }

        .filters-section {
          margin-bottom: 32px;
        }

        .filter-chips-row {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding: 4px 0;
          scrollbar-width: none; /* Hide scrollbar Firefox */
        }

        .filter-chips-row::-webkit-scrollbar {
          display: none; /* Hide scrollbar Chrome/Safari */
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

        .avatar-stack {
          display: flex;
          align-items: center;
          padding-right: 8px;
        }

        .stack-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 1.5px solid white;
          background-color: var(--color-surface-container);
        }

        .empty-state {
          text-align: center;
          padding: 48px;
          background-color: var(--color-surface-container-low);
          border-radius: 24px;
          border: 2px dashed var(--color-outline-variant);
          color: var(--color-text-muted);
        }

        .empty-icon {
          color: var(--color-butter);
          margin-bottom: 16px;
        }

        .empty-state h4 {
          margin-bottom: 8px;
          font-size: 18px;
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
        }
      `}</style>
    </Layout>
  )
}
