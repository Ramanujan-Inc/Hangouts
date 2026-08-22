import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import { Smile, Film, FileText, DollarSign } from 'lucide-react'
import { hangoutById } from '../../data/mock'
import { api } from '../../lib/api'
import { SegmentedTabs } from '../../components/ui'
import {
  HangoutTab,
  HangoutMedia,
  HangoutNote,
  HangoutExpense,
  DebtSettlement,
  HangoutHeroHeader,
  OverviewTab,
  MediaGalleryTab,
  MediaLightboxModal,
  MediaUploadSheet,
  NotesTab,
  AddNoteModal,
  ExpensesTab,
  AddExpenseModal,
} from '../../components/hangout'

export default function HangoutDetail() {
  const router = useRouter()
  const { id } = router.query
  const hangoutId = (Array.isArray(id) ? id[0] : id) || '1'
  const mockData = hangoutById(hangoutId)

  const [activeTab, setActiveTab] = useState<HangoutTab>('overview')
  const [data, setData] = useState<any>(mockData)
  const [rating, setRating] = useState(mockData?.rating || 4)

  useEffect(() => {
    async function loadHangout() {
      if (!hangoutId) return
      try {
        const res = await api.get<any>(`/hangouts/${hangoutId}`)
        if (res) {
          const participantNames = res.participants && res.participants.length > 0
            ? res.participants.map((p: any) => p.profile?.username || p.user_id)
            : mockData?.participants || ['mika']

          setData({
            id: res.id,
            title: res.title,
            description: res.description || mockData?.description || '',
            date: res.hangout_date || mockData?.date || '2026-08-22',
            location: res.location_name || mockData?.location || 'No location set',
            formattedAddress: res.formatted_address,
            placeId: res.place_id,
            latitude: res.latitude,
            longitude: res.longitude,
            coverImage: res.cover_photo_url || mockData?.coverImage || 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=500&auto=format&fit=crop&q=60',
            participants: participantNames,
            rating: mockData?.rating || 4,
            media: mockData?.media || [],
            notes: mockData?.notes || [],
            expenses: mockData?.expenses || [],
          })
        }
      } catch (err) {
        console.warn('Failed to load API hangout, falling back to mock:', err)
      }
    }
    loadHangout()
  }, [hangoutId])

  // Media states
  const [media, setMedia] = useState<HangoutMedia[]>(data?.media || data?.photos || [])
  const [activeMedia, setActiveMedia] = useState<HangoutMedia | null>(null)
  const [showUploadMenu, setShowUploadMenu] = useState(false)
  const [mediaFilter, setMediaFilter] = useState<'all' | 'favorites' | 'videos'>('all')

  // Notes states
  const [notes, setNotes] = useState<HangoutNote[]>(data?.notes || [])
  const [showAddNote, setShowAddNote] = useState(false)

  // Expenses states
  const [expenses, setExpenses] = useState<HangoutExpense[]>(data?.expenses || [])
  const [showAddExpense, setShowAddExpense] = useState(false)

  if (!data) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h3>Hangout not found</h3>
          <Link href="/timeline" style={{ color: 'var(--color-blush)', fontWeight: 700 }}>
            Go back to Timeline
          </Link>
        </div>
      </Layout>
    )
  }

  const currentUserId = 'mika'

  // Expense calculations
  const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0)

  const computeBalances = (): Record<string, number> => {
    const spends: Record<string, number> = {}
    data.participants.forEach((p) => {
      spends[p] = 0
    })

    expenses.forEach((exp) => {
      const payer = exp.paidBy
      const splitCount = exp.splitWith.length
      if (splitCount === 0) return

      const share = exp.amount / splitCount
      data.participants.forEach((p) => {
        if (exp.splitWith.includes(p)) {
          if (p === payer) {
            spends[p] += exp.amount - share
          } else {
            spends[p] -= share
          }
        }
      })
    })

    return spends
  }

  const balances = computeBalances()

  const getOwesWhomList = (): DebtSettlement[] => {
    const list: DebtSettlement[] = []
    const sortedBalances = Object.entries(balances).map(([user, bal]) => ({ user, bal }))

    const debtors = sortedBalances
      .filter((x) => x.bal < 0)
      .map((x) => ({ ...x, bal: Math.abs(x.bal) }))
    const creditors = sortedBalances.filter((x) => x.bal > 0)

    let dIdx = 0
    let cIdx = 0

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx]
      const creditor = creditors[cIdx]
      const min = Math.min(debtor.bal, creditor.bal)

      if (min > 1) {
        list.push({ from: debtor.user, to: creditor.user, amount: Math.round(min) })
      }

      debtor.bal -= min
      creditor.bal -= min

      if (debtor.bal < 1) dIdx++
      if (creditor.bal < 1) cIdx++
    }

    return list
  }

  const debtsList = getOwesWhomList()

  // Media handlers
  const handleToggleFavorite = (mediaId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setMedia(
      media.map((m) => {
        if (m.id !== mediaId) return m
        const favoritedByList = m.favoritedBy || []
        const isAlreadyFavorited = favoritedByList.includes(currentUserId)
        const newFavoritedBy = isAlreadyFavorited
          ? favoritedByList.filter((uid) => uid !== currentUserId)
          : [...favoritedByList, currentUserId]
        const newLikes = isAlreadyFavorited ? Math.max(0, m.likes - 1) : m.likes + 1
        return { ...m, favoritedBy: newFavoritedBy, likes: newLikes }
      })
    )
    if (activeMedia?.id === mediaId) {
      const favoritedByList = activeMedia.favoritedBy || []
      const isAlreadyFavorited = favoritedByList.includes(currentUserId)
      const newFavoritedBy = isAlreadyFavorited
        ? favoritedByList.filter((uid) => uid !== currentUserId)
        : [...favoritedByList, currentUserId]
      const newLikes = isAlreadyFavorited
        ? Math.max(0, activeMedia.likes - 1)
        : activeMedia.likes + 1
      setActiveMedia({ ...activeMedia, favoritedBy: newFavoritedBy, likes: newLikes })
    }
  }

  const handleDeleteMedia = (mediaId: string) => {
    setMedia(media.filter((m) => m.id !== mediaId))
    setActiveMedia(null)
  }

  const handleMockUpload = (url: string, type: 'photo' | 'video' = 'photo') => {
    const newMediaItem: HangoutMedia = {
      id: `m-${Date.now()}`,
      url,
      uploadedBy: 'mika',
      likes: 0,
      span: Math.random() > 0.5 ? 2 : 1,
      mediaType: type,
      favoritedBy: [],
    }
    setMedia([...media, newMediaItem])
    setShowUploadMenu(false)
  }

  // Note handlers
  const handleAddNote = (text: string, type: 'butter' | 'blush' | 'sea') => {
    const newNote: HangoutNote = {
      id: `n-${Date.now()}`,
      author: 'mika',
      text,
      time: 'Just now',
      type,
      rotation: Math.random() * 3 - 1.5,
    }
    setNotes([newNote, ...notes])
  }

  // Expense handlers
  const handleAddExpense = (
    amount: number,
    desc: string,
    paidBy: string,
    splitWith: string[]
  ) => {
    const newExp: HangoutExpense = {
      id: `e-${Date.now()}`,
      desc,
      amount,
      paidBy,
      splitWith,
      category: 'General',
    }
    setExpenses([...expenses, newExp])
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Smile size={16} /> },
    { id: 'media', label: 'Media', icon: <Film size={16} /> },
    { id: 'notes', label: 'Notes', icon: <FileText size={16} /> },
    { id: 'expenses', label: 'Expenses', icon: <DollarSign size={16} /> },
  ]

  return (
    <Layout>
      <Head>
        <title>{data.title} | Hangout</title>
      </Head>

      <div className="hangout-detail-page">
        {/* Cover Image Banner & Title Block */}
        <HangoutHeroHeader
          title={data.title}
          coverImage={data.coverImage}
          date={data.date}
          location={data.location}
          formattedAddress={data.formattedAddress}
          latitude={data.latitude}
          longitude={data.longitude}
          placeId={data.placeId}
          participants={data.participants}
          onBack={() => router.push('/timeline')}
        />

        {/* Segmented Pill Tab Bar */}
        <div className="tab-bar-container">
          <SegmentedTabs
            tabs={tabs}
            active={activeTab}
            onChange={(t) => setActiveTab(t as HangoutTab)}
          />
        </div>

        {/* Tab Contents */}
        <div className="tab-content-panel">
          {activeTab === 'overview' && (
            <OverviewTab
              description={data.description}
              location={data.location}
              rating={rating}
              onRatingChange={setRating}
            />
          )}

          {(activeTab === 'media' || activeTab === 'photos') && (
            <MediaGalleryTab
              media={media}
              currentUserId={currentUserId}
              mediaFilter={mediaFilter}
              onSetFilter={setMediaFilter}
              onOpenUploadMenu={() => setShowUploadMenu(true)}
              onSelectMedia={setActiveMedia}
              onToggleFavorite={handleToggleFavorite}
            />
          )}

          {activeTab === 'notes' && (
            <NotesTab notes={notes} onOpenAddNote={() => setShowAddNote(true)} />
          )}

          {activeTab === 'expenses' && (
            <ExpensesTab
              expenses={expenses}
              balances={balances}
              debtsList={debtsList}
              totalSpent={totalSpent}
              onOpenAddExpense={() => setShowAddExpense(true)}
            />
          )}
        </div>

        {/* Lightbox Fullscreen Media Viewer */}
        <MediaLightboxModal
          activeMedia={activeMedia}
          currentUserId={currentUserId}
          onClose={() => setActiveMedia(null)}
          onToggleFavorite={handleToggleFavorite}
          onDeleteMedia={handleDeleteMedia}
        />

        {/* Mock Upload Menu */}
        <MediaUploadSheet
          isOpen={showUploadMenu}
          onClose={() => setShowUploadMenu(false)}
          onMockUpload={handleMockUpload}
        />

        {/* Add Note Modal */}
        <AddNoteModal
          isOpen={showAddNote}
          onClose={() => setShowAddNote(false)}
          onAddNote={handleAddNote}
        />

        {/* Add Expense Modal */}
        <AddExpenseModal
          isOpen={showAddExpense}
          onClose={() => setShowAddExpense(false)}
          participants={data.participants}
          onAddExpense={handleAddExpense}
        />
      </div>

      <style jsx>{`
        .hangout-detail-page {
          max-width: 800px;
          margin: 0 auto;
          padding-bottom: 80px;
        }

        .tab-bar-container {
          padding: 0 20px;
          margin-bottom: 24px;
        }

        .tab-content-panel {
          padding: 0 20px;
        }
      `}</style>
    </Layout>
  )
}
