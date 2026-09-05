import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import Layout from '../../components/Layout'
import { ProtectedRoute } from '../../components/ProtectedRoute'
import { useAuth } from '../../context/AuthContext'
import { Smile, Film, FileText, DollarSign } from 'lucide-react'
import { api } from '../../lib/api'
import { getHangoutShortId } from '../../lib/hangoutUrl'
import { SegmentedTabs, Spinner } from '../../components/ui'
import {
  HangoutTab,
  HangoutDetailData,
  HangoutMedia,
  HangoutNote,
  HangoutExpense,
  ExpenseSummary,
  HangoutHeroHeader,
  OverviewTab,
  MediaGalleryTab,
  MediaLightboxModal,
  MediaUploadSheet,
  NotesTab,
  AddNoteModal,
  ExpensesTab,
  AddExpenseModal,
  NoteType,
} from '../../components/hangout'

export default function HangoutDetailPage() {
  return (
    <ProtectedRoute>
      <HangoutDetailContent />
    </ProtectedRoute>
  )
}

function HangoutDetailContent() {
  const router = useRouter()
  const { id } = router.query
  const hangoutId = Array.isArray(id) ? id[0] : id
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState<HangoutTab>('overview')

  // SWR Queries
  const {
    data: hangout,
    error: hangoutError,
    isLoading: hangoutLoading,
    mutate: mutateHangout,
  } = useSWR<HangoutDetailData>(hangoutId ? `/hangouts/${hangoutId}` : null)

  const canonicalId = hangout?.id || hangoutId

  // Normalize URL to short ID in address bar
  useEffect(() => {
    if (!hangout) return
    const canonicalShortId = getHangoutShortId(hangout)
    if (canonicalShortId && router.query.id && router.query.id !== canonicalShortId) {
      window.history.replaceState(null, '', `/hangout/${canonicalShortId}`)
    }
  }, [hangout, router.query.id])

  const {
    data: mediaData,
    mutate: mutateMedia,
  } = useSWR<HangoutMedia[]>(canonicalId ? `/hangouts/${canonicalId}/media` : null)

  const {
    data: ratingData,
    mutate: mutateRating,
  } = useSWR<{ rating: number } | null>(canonicalId ? `/hangouts/${canonicalId}/ratings` : null)

  const {
    data: notesData,
    mutate: mutateNotes,
  } = useSWR<HangoutNote[]>(canonicalId ? `/hangouts/${canonicalId}/notes` : null)

  const {
    data: expensesData,
    mutate: mutateExpenses,
  } = useSWR<HangoutExpense[]>(canonicalId ? `/hangouts/${canonicalId}/expenses` : null)

  const {
    data: expenseSummaryData,
    mutate: mutateSummary,
  } = useSWR<ExpenseSummary>(canonicalId ? `/hangouts/${canonicalId}/expenses/summary` : null)

  const media = mediaData || []
  const rating = ratingData?.rating || 4
  const notes = notesData || []
  const expenses = expensesData || []
  const expenseSummary = expenseSummaryData || null
  const loading = hangoutLoading && !hangout
  const error = hangoutError?.message || null

  // Media states
  const [activeMedia, setActiveMedia] = useState<HangoutMedia | null>(null)
  const [showUploadMenu, setShowUploadMenu] = useState(false)
  const [isUploadingMedia, setIsUploadingMedia] = useState(false)
  const [mediaFilter, setMediaFilter] = useState<'all' | 'favorites' | 'videos'>('all')

  // Notes states
  const [showAddNote, setShowAddNote] = useState(false)
  const [isSubmittingNote, setIsSubmittingNote] = useState(false)

  // Expenses states
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false)

  // Overview Tab Rating Handler
  const handleRatingChange = async (newRating: number) => {
    if (!canonicalId) return
    mutateRating({ rating: newRating }, false)
    try {
      await api.post(`/hangouts/${canonicalId}/ratings`, { rating: newRating })
      mutateRating()
    } catch (err) {
      console.error('Failed to save rating:', err)
      mutateRating()
    }
  }

  // Media Tab Handlers
  const handleUploadMedia = async (
    items: { file: File; caption?: string }[],
    isShared: boolean = true
  ) => {
    if (!canonicalId || items.length === 0) return
    try {
      setIsUploadingMedia(true)
      const formData = new FormData()
      items.forEach((item) => {
        formData.append('files', item.file)
      })
      const captionsList = items.map((item) => item.caption || '')
      formData.append('captions_json', JSON.stringify(captionsList))
      formData.append('is_shared', String(isShared))

      const uploadedItems = await api.upload<HangoutMedia[]>(`/hangouts/${canonicalId}/media/bulk`, formData)
      const newItems = Array.isArray(uploadedItems) ? uploadedItems : [uploadedItems]
      mutateMedia([...newItems, ...media], false)
      setShowUploadMenu(false)
      mutateMedia()
    } catch (err: any) {
      console.error('Failed to upload media:', err)
      throw err
    } finally {
      setIsUploadingMedia(false)
    }
  }

  const handleToggleFavorite = async (mediaId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const target = media.find((m) => m.id === mediaId)
    if (!target) return

    const wasFavorited = Boolean(target.is_favorited)
    const newFavorited = !wasFavorited
    const newCount = newFavorited
      ? (target.favorites_count || 0) + 1
      : Math.max((target.favorites_count || 0) - 1, 0)

    // Optimistic UI update
    const updatedMedia = media.map((m) =>
      m.id === mediaId
        ? { ...m, is_favorited: newFavorited, favorites_count: newCount }
        : m
    )
    mutateMedia(updatedMedia, false)

    if (activeMedia?.id === mediaId) {
      setActiveMedia((prev) =>
        prev
          ? { ...prev, is_favorited: newFavorited, favorites_count: newCount }
          : null
      )
    }

    try {
      if (newFavorited) {
        await api.post(`/media/${mediaId}/favorite`)
      } else {
        await api.delete(`/media/${mediaId}/favorite`)
      }
      mutateMedia()
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
      mutateMedia()
    }
  }

  const handleDeleteMedia = async (mediaId: string) => {
    try {
      await api.delete(`/media/${mediaId}`)
      mutateMedia(media.filter((m) => m.id !== mediaId), false)
      setActiveMedia(null)
      mutateMedia()
    } catch (err) {
      console.error('Failed to delete media:', err)
    }
  }

  // Notes Tab Handlers
  const handleAddNote = async (text: string, isShared: boolean, type: NoteType) => {
    if (!canonicalId) return
    try {
      setIsSubmittingNote(true)
      const newNote = await api.post<HangoutNote>(`/hangouts/${canonicalId}/notes`, {
        content: text,
        color: type,
        is_shared: isShared,
      })
      newNote.color = newNote.color || type
      mutateNotes([newNote, ...notes], false)
      setShowAddNote(false)
      mutateNotes()
    } catch (err) {
      console.error('Failed to add note:', err)
    } finally {
      setIsSubmittingNote(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    try {
      await api.delete(`/notes/${noteId}`)
      mutateNotes(notes.filter((n) => n.id !== noteId), false)
      mutateNotes()
    } catch (err) {
      console.error('Failed to delete note:', err)
    }
  }

  // Expenses Tab Handlers
  const handleAddExpense = async (
    amount: number,
    description: string,
    paidBy: string,
    splitType: 'equal' | 'personal'
  ) => {
    if (!canonicalId) return
    try {
      setIsSubmittingExpense(true)
      await api.post<HangoutExpense>(`/hangouts/${canonicalId}/expenses`, {
        description,
        total_amount: amount,
        split_type: splitType,
        paid_by: paidBy,
      })

      setShowAddExpense(false)
      await Promise.all([mutateExpenses(), mutateSummary()])
    } catch (err) {
      console.error('Failed to create expense:', err)
    } finally {
      setIsSubmittingExpense(false)
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!canonicalId) return
    try {
      await api.delete(`/expenses/${expenseId}`)
      mutateExpenses(expenses.filter((e) => e.id !== expenseId), false)
      await Promise.all([mutateExpenses(), mutateSummary()])
    } catch (err) {
      console.error('Failed to delete expense:', err)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Spinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (error || !hangout) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h3>{error || 'Hangout not found'}</h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px' }}>
            We could not find the hangout you were looking for.
          </p>
          <Link href="/timeline" style={{ color: 'var(--color-blush)', fontWeight: 700 }}>
            ← Go back to Timeline
          </Link>
        </div>
      </Layout>
    )
  }

  const currentUserId = user?.id || ''
  const participantsList = hangout.participants || []

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Smile size={16} /> },
    { id: 'media', label: 'Media', icon: <Film size={16} /> },
    { id: 'notes', label: 'Notes', icon: <FileText size={16} /> },
    { id: 'expenses', label: 'Expenses', icon: <DollarSign size={16} /> },
  ]

  return (
    <Layout>
      <Head>
        <title>{hangout.title} | Hangout</title>
      </Head>

      <div className="hangout-detail-page">
        {/* Cover Image Banner & Title Block */}
        <HangoutHeroHeader
          title={hangout.title}
          coverImage={hangout.cover_photo_url || '/images/covers/hangout-default.jpg'}
          date={hangout.hangout_date}
          location={hangout.location_name || 'No location set'}
          formattedAddress={hangout.formatted_address || undefined}
          latitude={hangout.latitude ?? undefined}
          longitude={hangout.longitude ?? undefined}
          placeId={hangout.place_id || undefined}
          participants={participantsList}
          inviteCode={hangout.invite_code}
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
              title={hangout.title}
              description={hangout.description}
              location={hangout.location_name || 'No location set'}
              formattedAddress={hangout.formatted_address}
              latitude={hangout.latitude}
              longitude={hangout.longitude}
              placeId={hangout.place_id}
              coverPhotoUrl={hangout.cover_photo_url}
              rating={rating}
              onRatingChange={handleRatingChange}
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
            <NotesTab
              notes={notes}
              currentUserId={currentUserId}
              onOpenAddNote={() => setShowAddNote(true)}
              onDeleteNote={handleDeleteNote}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesTab
              expenses={expenses}
              summary={expenseSummary}
              currentUserId={currentUserId}
              creatorId={hangout.created_by}
              onOpenAddExpense={() => setShowAddExpense(true)}
              onDeleteExpense={handleDeleteExpense}
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

        {/* Dropzone Media Upload Menu */}
        <MediaUploadSheet
          isOpen={showUploadMenu}
          isUploading={isUploadingMedia}
          onClose={() => setShowUploadMenu(false)}
          onUpload={handleUploadMedia}
        />

        {/* Add Note Modal */}
        <AddNoteModal
          isOpen={showAddNote}
          isSubmitting={isSubmittingNote}
          onClose={() => setShowAddNote(false)}
          onAddNote={handleAddNote}
        />

        {/* Add Expense Modal */}
        <AddExpenseModal
          isOpen={showAddExpense}
          isSubmitting={isSubmittingExpense}
          onClose={() => setShowAddExpense(false)}
          participants={participantsList}
          currentUserId={currentUserId}
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
