import React, { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../components/Layout'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { Sparkles } from 'lucide-react'
import { EmptyState, Button, Spinner } from '../components/ui'
import {
  Hangout,
  Memory,
  Group,
  QuickFilter,
  TimelineHeader,
  TimelineFilterDrawer,
  QuickFilterChips,
  MemoryHeroBanner,
  HangoutCard,
} from '../components/timeline'

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
  const [activeQuickFilter, setActiveQuickFilter] = useState<QuickFilter>('All')
  const [showFilterDrawer, setShowFilterDrawer] = useState(false)

  const activeFiltersCount =
    (hangoutNameQuery ? 1 : 0) +
    (locationNameQuery ? 1 : 0) +
    (dateQuery ? 1 : 0) +
    (groupNameQuery ? 1 : 0)

  const hasActiveFilters = Boolean(
    searchQuery ||
      hangoutNameQuery ||
      locationNameQuery ||
      dateQuery ||
      groupNameQuery ||
      activeQuickFilter !== 'All'
  )

  const fetchHangouts = useCallback(async () => {
    if (!user) return
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
  }, [user, searchQuery, hangoutNameQuery, locationNameQuery, dateQuery, groupNameQuery])

  const fetchMemories = async () => {
    if (!user) return
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
    if (!user) return
    try {
      const data = await api.get<Group[]>('/groups')
      setGroupsList(data || [])
    } catch (err) {
      console.error('Failed to fetch groups:', err)
    }
  }

  useEffect(() => {
    if (user) {
      fetchGroups()
      fetchMemories()
    }
  }, [user])

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        fetchHangouts()
      }, 250)
      return () => clearTimeout(timer)
    }
  }, [user, fetchHangouts])

  const handleResetFilters = () => {
    setSearchQuery('')
    setHangoutNameQuery('')
    setLocationNameQuery('')
    setDateQuery('')
    setGroupNameQuery('')
    setActiveQuickFilter('All')
  }

  const displayedHangouts = hangoutsList.filter((h) => {
    if (activeQuickFilter === 'Created by Me') {
      return Boolean(user?.id && h.created_by === user.id)
    }
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
          <TimelineHeader
            userName={userName}
            userAvatar={userAvatar}
            groupsCount={groupsList.length}
          />

          {/* Search & Filter Controls */}
          <TimelineFilterDrawer
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            hangoutNameQuery={hangoutNameQuery}
            onHangoutNameChange={setHangoutNameQuery}
            locationNameQuery={locationNameQuery}
            onLocationNameChange={setLocationNameQuery}
            dateQuery={dateQuery}
            onDateChange={setDateQuery}
            groupNameQuery={groupNameQuery}
            onGroupNameChange={setGroupNameQuery}
            groupsList={groupsList}
            activeFiltersCount={activeFiltersCount}
            showFilterDrawer={showFilterDrawer}
            onToggleFilterDrawer={() => setShowFilterDrawer(!showFilterDrawer)}
            onResetFilters={handleResetFilters}
            hasActiveFilters={hasActiveFilters}
          />

          {/* Quick Preset Filter Chips */}
          <QuickFilterChips
            activeQuickFilter={activeQuickFilter}
            onSelectFilter={setActiveQuickFilter}
          />

          {/* "On This Day" Memory Hero Card */}
          {showMemory && memory && activeQuickFilter === 'All' && !searchQuery && (
            <MemoryHeroBanner
              memory={memory}
              showMemory={showMemory}
              onDismiss={() => setShowMemory(false)}
            />
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
              <Spinner centered label="Gathering memories..." />
            ) : displayedHangouts.length === 0 ? (
              <div className="empty-state-wrapper">
                <EmptyState
                  variant="card"
                  icon={<Sparkles size={48} />}
                  title="No hangouts found"
                  description="Create a new hangout meetup with your crew."
                />
                <div className="create-hangout-cta">
                  <Link href="/create">
                    <Button variant="primary">Create a Hangout</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="hangout-cards-grid">
                {displayedHangouts.map((h, idx) => (
                  <HangoutCard
                    key={h.id}
                    hangout={h}
                    index={idx}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          .timeline-page {
            max-width: 1000px;
            margin: 0 auto;
            padding-bottom: 80px;
          }

          .timeline-feed {
            margin-top: 8px;
          }

          .feed-title-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }

          .feed-title-row h3 {
            font-size: 22px;
            margin: 0;
            color: var(--color-text);
          }

          .feed-count {
            font-size: 13px;
            color: var(--color-text-muted);
            font-weight: 700;
          }

          .empty-state-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
          }

          .create-hangout-cta {
            margin-top: 8px;
          }

          .hangout-cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 24px;
          }
        `}</style>
      </Layout>
    </ProtectedRoute>
  )
}
