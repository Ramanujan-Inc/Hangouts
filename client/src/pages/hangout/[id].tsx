import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import { 
  ArrowLeft, Share2, MapPin, Calendar, Heart, Trash2, Plus, 
  Smile, Image as ImageIcon, FileText, DollarSign, X, Check, ArrowRight
} from 'lucide-react'

// Members
const members = {
  mika: { name: 'Mika', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=mika' },
  jam: { name: 'Jam', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=jam' },
  dave: { name: 'Dave', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=dave' },
  chloe: { name: 'Chloe', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=chloe' },
}

// Initial mockup data
const initialHangoutData = {
  '1': {
    title: 'Friday Night Ramen',
    description: 'Craving spicy tonkotsu ramen after a long week. Ended up talking for hours about trip planning and old college memories. We ordered the special Gyoza too!',
    date: '2025-07-29',
    location: 'Ramen Nagi, BGC',
    coverImage: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80',
    participants: ['mika', 'jam', 'dave'],
    rating: 4, // out of 5
    photos: [
      { id: 'p1', url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80', uploadedBy: 'mika', likes: 4, span: 2 },
      { id: 'p2', url: 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&fit=crop&w=600&q=80', uploadedBy: 'jam', likes: 2, span: 1 },
      { id: 'p3', url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80', uploadedBy: 'dave', likes: 3, span: 1 },
      { id: 'p4', url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80', uploadedBy: 'mika', likes: 5, span: 2 }
    ],
    notes: [
      { id: 'n1', author: 'mika', text: 'Jam ate 3 bowls of noodles! Certified black hole stomach.', time: '1 year ago', type: 'butter', rotation: -1.5 },
      { id: 'n2', author: 'dave', text: 'Note to self: The Red King ramen at Level 3 spice is actually spicy. Bring milk next time.', time: '1 year ago', type: 'blush', rotation: 1.2 },
      { id: 'n3', author: 'jam', text: 'Next meetup should be at the beach! Let’s plan for next month.', time: '1 year ago', type: 'sea', rotation: 2.0 }
    ],
    expenses: [
      { id: 'e1', desc: 'Ramen Bowls & Gyoza', amount: 1800, paidBy: 'mika', splitWith: ['mika', 'jam', 'dave'], category: 'Food' },
      { id: 'e2', desc: 'Dessert & Milk tea', amount: 450, paidBy: 'jam', splitWith: ['mika', 'jam', 'dave'], category: 'Drinks' }
    ]
  },
  '2': {
    title: 'Beach Day Picnic',
    description: 'Road trip to the beach! Super clear waters and awesome music.',
    date: '2026-07-15',
    location: 'Anawangin Cove',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    participants: ['mika', 'jam', 'dave', 'chloe'],
    rating: 5,
    photos: [],
    notes: [],
    expenses: []
  },
  '3': {
    title: 'Coffee & Boardgames',
    description: 'Relaxing afternoon cafe session.',
    date: '2026-07-26',
    location: 'Wildflour Cafe',
    coverImage: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80',
    participants: ['mika', 'dave'],
    rating: 4,
    photos: [],
    notes: [],
    expenses: []
  }
}

const emojis = ['😴', '😐', '🙂', '😊', '😍']

export default function HangoutDetail() {
  const router = useRouter()
  const { id } = router.query
  const hangoutId = (id as string) || '1'
  const data = initialHangoutData[hangoutId as keyof typeof initialHangoutData]

  const [activeTab, setActiveTab] = useState<'overview' | 'photos' | 'notes' | 'expenses'>('overview')
  const [rating, setRating] = useState(data?.rating || 4)

  // Photos states
  const [photos, setPhotos] = useState(data?.photos || [])
  const [activePhoto, setActivePhoto] = useState<any>(null)
  const [showUploadMenu, setShowUploadMenu] = useState(false)

  // Notes states
  const [notes, setNotes] = useState(data?.notes || [])
  const [showAddNote, setShowAddNote] = useState(false)
  const [newNoteText, setNewNoteText] = useState('')
  const [newNoteType, setNewNoteType] = useState<'butter' | 'blush' | 'sea'>('butter')

  // Expenses states
  const [expenses, setExpenses] = useState(data?.expenses || [])
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [expAmount, setExpAmount] = useState('')
  const [expDesc, setExpDesc] = useState('')
  const [expPaidBy, setExpPaidBy] = useState('mika')
  const [expSplitWith, setExpSplitWith] = useState<string[]>(data?.participants || [])

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

  // Expense calculations
  const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0)
  
  // Calculate individual balances
  const computeBalances = () => {
    const spends: Record<string, number> = {}
    data.participants.forEach(p => { spends[p] = 0 })

    expenses.forEach(exp => {
      const payer = exp.paidBy
      const splitCount = exp.splitWith.length
      if (splitCount === 0) return
      
      const share = exp.amount / splitCount
      data.participants.forEach(p => {
        if (exp.splitWith.includes(p)) {
          if (p === payer) {
            spends[p] += (exp.amount - share)
          } else {
            spends[p] -= share
          }
        }
      })
    })

    return spends
  }

  const balances = computeBalances()
  const getOwesWhomList = () => {
    const list: Array<{ from: string, to: string, amount: number }> = []
    const sortedBalances = Object.entries(balances).map(([user, bal]) => ({ user, bal }))
    
    // Simple greedy matching for simplified debts
    const debtors = sortedBalances.filter(x => x.bal < 0).map(x => ({ ...x, bal: Math.abs(x.bal) }))
    const creditors = sortedBalances.filter(x => x.bal > 0)

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

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNoteText.trim()) return
    const newNote = {
      id: `n-${Date.now()}`,
      author: 'mika',
      text: newNoteText,
      time: 'Just now',
      type: newNoteType,
      rotation: Math.random() * 3 - 1.5
    }
    setNotes([newNote, ...notes])
    setNewNoteText('')
    setShowAddNote(false)
  }

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(expAmount)
    if (isNaN(amt) || amt <= 0 || !expDesc.trim()) return
    
    const newExp = {
      id: `e-${Date.now()}`,
      desc: expDesc,
      amount: amt,
      paidBy: expPaidBy,
      splitWith: expSplitWith,
      category: 'General'
    }

    setExpenses([...expenses, newExp])
    setExpAmount('')
    setExpDesc('')
    setShowAddExpense(false)
  }

  const handleLikePhoto = (photoId: string) => {
    setPhotos(photos.map(p => p.id === photoId ? { ...p, likes: p.likes + 1 } : p))
    if (activePhoto?.id === photoId) {
      setActivePhoto({ ...activePhoto, likes: activePhoto.likes + 1 })
    }
  }

  const handleDeletePhoto = (photoId: string) => {
    setPhotos(photos.filter(p => p.id !== photoId))
    setActivePhoto(null)
  }

  const handleMockUpload = (url: string) => {
    const newPhoto = {
      id: `p-${Date.now()}`,
      url,
      uploadedBy: 'mika',
      likes: 0,
      span: Math.random() > 0.5 ? 2 : 1
    }
    setPhotos([...photos, newPhoto])
    setShowUploadMenu(false)
  }

  return (
    <Layout>
      <Head>
        <title>{data.title} | Hangout</title>
      </Head>

      <div className="hangout-detail-page">
        {/* Cover Image Banner */}
        <div className="detail-cover-container">
          <img src={data.coverImage} alt={data.title} className="detail-cover-img" />
          <div className="cover-floating-btns">
            <button className="frosted-btn" onClick={() => router.push('/timeline')}>
              <ArrowLeft size={18} />
            </button>
            <button className="frosted-btn">
              <Share2 size={18} />
            </button>
          </div>
        </div>

        {/* Title Block */}
        <section className="title-section">
          <div className="title-row">
            <h2>{data.title}</h2>
          </div>
          
          <div className="metadata-row">
            <div className="meta-item">
              <Calendar size={16} />
              <span>{new Date(data.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="meta-item">
              <MapPin size={16} className="loc-pin" />
              <span>{data.location}</span>
            </div>
          </div>

          <div className="participants-row">
            <span className="participants-label">Joined:</span>
            <div className="avatar-stack-large">
              {data.participants.map((p, i) => (
                <div 
                  key={p} 
                  className="stack-avatar-wrapper"
                  style={{ zIndex: 10 - i, transform: `translateX(-${i * 12}px)` }}
                  title={members[p as keyof typeof members].name}
                >
                  <img src={members[p as keyof typeof members].avatar} alt={p} />
                </div>
              ))}
              <span className="avatar-count-badge" style={{ transform: `translateX(-${(data.participants.length - 1) * 8}px)` }}>
                {data.participants.length} friends
              </span>
            </div>
          </div>
        </section>

        {/* Segmented Pill Tab Bar */}
        <div className="tab-bar-container">
          <div className="segmented-tab-bar">
            {(['overview', 'photos', 'notes', 'expenses'] as const).map((tab) => (
              <button
                key={tab}
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'overview' && <Smile size={16} />}
                {tab === 'photos' && <ImageIcon size={16} />}
                {tab === 'notes' && <FileText size={16} />}
                {tab === 'expenses' && <DollarSign size={16} />}
                <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Contents */}
        <div className="tab-content-panel">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="content-card description-card">
                <h3>About the Meetup</h3>
                <p>{data.description}</p>
              </div>

              {/* Mini Map Preview */}
              <div className="content-card map-preview-card">
                <h3>Location Details</h3>
                <div className="mini-map-container">
                  <div className="mini-map-pin">
                    <MapPin size={24} fill="var(--color-blush)" color="white" />
                  </div>
                  <span className="mini-map-label">{data.location}</span>
                </div>
              </div>

              {/* Memory Rating Emoji Slider */}
              <div className="content-card rating-card">
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
                      onChange={(e) => setRating(parseInt(e.target.value))}
                      className="emoji-range-input"
                    />
                    <div className="slider-labels">
                      <span>Cozy</span>
                      <span>Great</span>
                      <span>Unforgettable!</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="photos-tab">
              <div className="tab-section-header">
                <h3>Photo Stack ({photos.length})</h3>
                <button className="pill-button pill-button-primary compact-btn" onClick={() => setShowUploadMenu(true)}>
                  <Plus size={16} /> Add Photos
                </button>
              </div>

              {photos.length === 0 ? (
                <div className="empty-sub-state">
                  <ImageIcon size={32} />
                  <p>No photos uploaded yet. Drop a memory here!</p>
                </div>
              ) : (
                <div className="masonry-gallery">
                  {photos.map((photo) => (
                    <div 
                      key={photo.id} 
                      className={`gallery-item span-${photo.span}`}
                      onClick={() => setActivePhoto(photo)}
                    >
                      <img src={photo.url} alt="Hangout memory" />
                      <div className="uploader-badge">
                        <img src={members[photo.uploadedBy as keyof typeof members].avatar} alt={photo.uploadedBy} />
                      </div>
                      <div className="photo-likes-overlay">
                        <Heart size={14} fill="white" />
                        <span>{photo.likes}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="notes-tab">
              <div className="tab-section-header">
                <h3>Collaborative Sticky Notes</h3>
                <button className="pill-button pill-button-primary compact-btn" onClick={() => setShowAddNote(true)}>
                  <Plus size={16} /> Add Note
                </button>
              </div>

              {notes.length === 0 ? (
                <div className="empty-sub-state">
                  <FileText size={32} />
                  <p>No notes written yet. Jot down funny quotes or memories!</p>
                </div>
              ) : (
                <div className="sticky-notes-board">
                  {notes.map((note) => (
                    <div 
                      key={note.id} 
                      className={`sticky-note sticky-note-${note.type}`}
                      style={{ transform: `rotate(${note.rotation}deg)` }}
                    >
                      <p className="note-text">"{note.text}"</p>
                      <div className="note-meta-footer">
                        <div className="note-author">
                          <img src={members[note.author as keyof typeof members].avatar} alt={note.author} />
                          <span>{members[note.author as keyof typeof members].name}</span>
                        </div>
                        <span className="note-time">{note.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="expenses-tab">
              {/* Summary card */}
              <div className="expense-summary-card">
                <div className="summary-left">
                  <span className="summary-lbl">Total Spent</span>
                  <h3>₱{totalSpent.toLocaleString()}</h3>
                  <span className="summary-sub">across {expenses.length} payments</span>
                </div>
                <button className="pill-button pill-button-primary" onClick={() => setShowAddExpense(true)}>
                  <Plus size={18} /> Log Expense
                </button>
              </div>

              {/* Spend Chart breakdown */}
              {expenses.length > 0 && (
                <div className="spend-chart-section">
                  <h4>Member Spending Breakdown</h4>
                  <div className="chart-bars-list">
                    {Object.entries(balances).map(([user, bal]) => {
                      const totalPaid = expenses
                        .filter(e => e.paidBy === user)
                        .reduce((s, e) => s + e.amount, 0)
                      const pct = totalSpent > 0 ? (totalPaid / totalSpent) * 100 : 0
                      
                      return (
                        <div key={user} className="chart-row">
                          <div className="chart-member-label">
                            <img src={members[user as keyof typeof members].avatar} alt={user} />
                            <span>{members[user as keyof typeof members].name}</span>
                          </div>
                          <div className="chart-bar-track">
                            <div 
                              className="chart-bar-fill" 
                              style={{ width: `${Math.max(pct, 5)}%`, backgroundColor: user === 'mika' ? 'var(--color-blush)' : user === 'jam' ? 'var(--color-tangerine)' : 'var(--color-sea)' }}
                            />
                            <span className="bar-val">₱{totalPaid.toLocaleString()}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Simplified Debts Sheet */}
              {debtsList.length > 0 && (
                <div className="debts-section">
                  <h4>Simplified Balances (Who Owes Whom)</h4>
                  <div className="debts-list">
                    {debtsList.map((debt, index) => (
                      <div key={index} className="debt-row-card">
                        <div className="debt-avatars">
                          <img src={members[debt.from as keyof typeof members].avatar} alt={debt.from} className="avatar-side" />
                          <ArrowRight size={16} className="arrow-icon" />
                          <img src={members[debt.to as keyof typeof members].avatar} alt={debt.to} className="avatar-side" />
                        </div>
                        <div className="debt-message">
                          <strong>{members[debt.from as keyof typeof members].name}</strong> owes <strong>{members[debt.to as keyof typeof members].name}</strong>
                        </div>
                        <div className="debt-badge">
                          ₱{debt.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expense History List */}
              <div className="expense-history-list">
                <h4>Expense History</h4>
                {expenses.length === 0 ? (
                  <div className="empty-sub-state">
                    <DollarSign size={32} />
                    <p>No expenses logged yet. Keep track of group splits here!</p>
                  </div>
                ) : (
                  <div className="expenses-grid">
                    {expenses.map((exp) => (
                      <div key={exp.id} className="expense-row-item">
                        <div className="payer-col">
                          <img src={members[exp.paidBy as keyof typeof members].avatar} alt={exp.paidBy} />
                          <div>
                            <div className="exp-desc">{exp.desc}</div>
                            <div className="exp-meta">Paid by {members[exp.paidBy as keyof typeof members].name} • Split among {exp.splitWith.length}</div>
                          </div>
                        </div>
                        <div className="amount-col">
                          <span>₱{exp.amount.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Fullscreen Photo Viewer */}
      {activePhoto && (
        <div className="lightbox-backdrop">
          <button className="lightbox-close" onClick={() => setActivePhoto(null)}>
            <X size={24} />
          </button>
          
          <div className="lightbox-container">
            <img src={activePhoto.url} alt="Lightbox View" className="lightbox-img" />
            
            {/* Top info bar */}
            <div className="lightbox-top-bar">
              <img src={members[activePhoto.uploadedBy as keyof typeof members].avatar} alt="Uploader" className="light-avatar" />
              <div>
                <div className="light-author">Uploaded by {members[activePhoto.uploadedBy as keyof typeof members].name}</div>
                <div className="light-time">1 year ago</div>
              </div>
            </div>

            {/* Bottom action bar */}
            <div className="lightbox-bottom-bar">
              <button className="light-action-btn" onClick={() => handleLikePhoto(activePhoto.id)}>
                <Heart size={20} fill={activePhoto.likes > 4 ? 'white' : 'transparent'} />
                <span>{activePhoto.likes} Likes</span>
              </button>
              
              {activePhoto.uploadedBy === 'mika' && (
                <button className="light-action-btn delete-btn" onClick={() => handleDeletePhoto(activePhoto.id)}>
                  <Trash2 size={20} />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mock Upload Menu (Bottom Sheet) */}
      {showUploadMenu && (
        <div className="bottom-sheet-backdrop" onClick={() => setShowUploadMenu(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <h3>Add Photos to Gallery</h3>
            <div className="sheet-options">
              <div 
                className="sheet-option-card"
                onClick={() => handleMockUpload('https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=600&q=80')}
              >
                <img src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=120&q=80" alt="Option 1" />
                <span>Mock: Group Toast</span>
              </div>
              <div 
                className="sheet-option-card"
                onClick={() => handleMockUpload('https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=600&q=80')}
              >
                <img src="https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=120&q=80" alt="Option 2" />
                <span>Mock: Cafe Latte</span>
              </div>
            </div>
            <button className="pill-button pill-button-outline full-width-btn" onClick={() => setShowUploadMenu(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showAddNote && (
        <div className="modal-backdrop">
          <form className="modal-content" onSubmit={handleAddNoteSubmit}>
            <h3>Write a Sticky Note</h3>
            <textarea 
              required
              className="note-textarea"
              placeholder="Write down funny quotes, inside jokes, or anything memorable..."
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
            />

            <div className="color-picker-row">
              <span className="picker-lbl">Note Style:</span>
              <div className="color-options">
                {(['butter', 'blush', 'sea'] as const).map((type) => (
                  <button 
                    key={type}
                    type="button"
                    className={`color-dot note-${type} ${newNoteType === type ? 'active' : ''}`}
                    onClick={() => setNewNoteType(type)}
                  />
                ))}
              </div>
            </div>

            <div className="modal-btn-row">
              <button type="submit" className="pill-button pill-button-primary">
                Post Note
              </button>
              <button type="button" className="pill-button pill-button-outline" onClick={() => setShowAddNote(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Expense Drawer */}
      {showAddExpense && (
        <div className="modal-backdrop">
          <form className="modal-content drawer-content" onSubmit={handleAddExpenseSubmit}>
            <h3>Log a Group Expense</h3>

            {/* Oversized Amount Field */}
            <div className="amount-input-wrapper">
              <span className="currency-lbl">₱</span>
              <input 
                type="number" 
                required 
                placeholder="0.00"
                value={expAmount}
                onChange={(e) => setExpAmount(e.target.value)}
                className="giant-amount-input"
                autoFocus
              />
            </div>

            <div className="input-group-field">
              <label>What was this for?</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Ramen Bowls"
                className="pill-input"
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
              />
            </div>

            <div className="input-group-field">
              <label>Paid by:</label>
              <div className="payer-chips">
                {data.participants.map((p) => (
                  <div 
                    key={p}
                    className={`payer-chip ${expPaidBy === p ? 'active' : ''}`}
                    onClick={() => setExpPaidBy(p)}
                  >
                    <img src={members[p as keyof typeof members].avatar} alt={p} />
                    <span>{members[p as keyof typeof members].name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Splits Indicator */}
            {expAmount && parseFloat(expAmount) > 0 && (
              <div className="split-summary-badge">
                Split equally — ₱{Math.round(parseFloat(expAmount) / expSplitWith.length)} each
              </div>
            )}

            <div className="modal-btn-row">
              <button type="submit" className="pill-button pill-button-primary">
                Save Expense
              </button>
              <button type="button" className="pill-button pill-button-outline" onClick={() => setShowAddExpense(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <style jsx>{`
        .hangout-detail-page {
          max-width: 800px;
          margin: 0 auto;
        }

        .detail-cover-container {
          position: relative;
          width: 100%;
          height: 280px;
          border-radius: 0 0 28px 28px;
          overflow: hidden;
          box-shadow: var(--shadow-ambient);
        }

        .detail-cover-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .cover-floating-btns {
          position: absolute;
          top: 20px;
          left: 20px;
          right: 20px;
          display: flex;
          justify-content: space-between;
        }

        .frosted-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 248, 245, 0.7);
          backdrop-filter: blur(8px);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text);
          cursor: pointer;
          transition: background 0.2s;
        }

        .frosted-btn:hover {
          background: rgba(255, 248, 245, 0.9);
        }

        .title-section {
          margin-top: 28px;
          margin-bottom: 24px;
        }

        .title-section h2 {
          font-size: 32px;
          font-family: var(--font-display);
        }

        .metadata-row {
          display: flex;
          gap: 20px;
          margin-top: 8px;
          color: var(--color-text-muted);
          font-size: 14px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .loc-pin {
          color: var(--color-sea);
        }

        .participants-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 16px;
          border-top: 1px dashed var(--color-outline-variant);
          padding-top: 16px;
        }

        .participants-label {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 14px;
          color: var(--color-text-muted);
        }

        .avatar-stack-large {
          display: flex;
          align-items: center;
        }

        .stack-avatar-wrapper img {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid white;
          background-color: var(--color-surface-container);
        }

        .avatar-count-badge {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text-muted);
          margin-left: 8px;
        }

        /* Segmented tab bar */
        .tab-bar-container {
          margin-bottom: 28px;
        }

        .segmented-tab-bar {
          background-color: var(--color-surface-container);
          padding: 6px;
          border-radius: 9999px;
          display: flex;
          gap: 4px;
          box-shadow: var(--shadow-inner);
        }

        .tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 9999px;
          border: none;
          background: transparent;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 14px;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tab-btn.active {
          background-color: var(--color-blush);
          color: white;
          box-shadow: 0 4px 10px rgba(227, 104, 136, 0.2);
        }

        /* Content cards */
        .content-card {
          background-color: var(--color-surface-container-lowest);
          border-radius: 24px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: var(--shadow-ambient);
          border: 1px solid var(--color-surface-container-high);
        }

        .content-card h3 {
          font-size: 20px;
          margin-bottom: 12px;
          font-family: var(--font-display);
        }

        .description-card p {
          color: var(--color-text-muted);
          line-height: 1.6;
        }

        /* Map Preview */
        .mini-map-container {
          height: 160px;
          background-color: #e5ecd6; /* Sage/cream land styling */
          border-radius: 16px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 1px solid var(--color-outline-variant);
        }

        .mini-map-pin {
          animation: float 2s ease-in-out infinite;
          z-index: 2;
        }

        .mini-map-label {
          position: absolute;
          bottom: 12px;
          background-color: rgba(46, 42, 40, 0.85);
          color: white;
          padding: 6px 12px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 700;
        }

        /* Rating card & emoji slider */
        .rating-subtitle {
          color: var(--color-text-muted);
          font-size: 14px;
          margin-bottom: 16px;
        }

        .emoji-slider-wrapper {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .emoji-display {
          font-size: 48px;
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--color-surface-container-low);
          border-radius: 50%;
        }

        .slider-container-box {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .emoji-range-input {
          -webkit-appearance: none;
          width: 100%;
          height: 8px;
          border-radius: 9999px;
          background: var(--color-surface-container-high);
          outline: none;
        }

        .emoji-range-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--color-blush);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }

        .slider-labels {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--color-text-muted);
          font-weight: 600;
        }

        /* Photos gallery tab */
        .tab-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .tab-section-header h3 {
          font-size: 22px;
          font-family: var(--font-display);
        }

        .compact-btn {
          padding: 8px 16px;
          font-size: 14px;
        }

        .empty-sub-state {
          text-align: center;
          padding: 40px;
          color: var(--color-text-muted);
        }

        .masonry-gallery {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .gallery-item {
          position: relative;
          aspect-ratio: 1;
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
          transition: transform 0.2s;
        }

        .gallery-item.span-2 {
          grid-column: span 2;
          aspect-ratio: 2/1;
        }

        .gallery-item:hover {
          transform: scale(1.02);
        }

        .gallery-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .uploader-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 1.5px solid white;
          overflow: hidden;
        }

        .uploader-badge img {
          width: 100%;
          height: 100%;
        }

        .photo-likes-overlay {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background: rgba(46, 42, 40, 0.6);
          color: white;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
        }

        /* Notes board */
        .sticky-notes-board {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 20px;
          padding: 10px 0;
        }

        .note-text {
          font-family: var(--font-body);
          font-size: 15px;
          margin-bottom: 16px;
          line-height: 1.4;
          font-style: italic;
        }

        .note-meta-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px dashed rgba(46,42,40,0.1);
          padding-top: 10px;
          font-size: 11px;
        }

        .note-author {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
        }

        .note-author img {
          width: 20px;
          height: 20px;
          border-radius: 50%;
        }

        .note-time {
          color: var(--color-text-muted);
        }

        /* Expenses tab */
        .expense-summary-card {
          background-color: #fcf1d3; /* Butter fill */
          border-radius: 24px;
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
          box-shadow: var(--shadow-ambient);
        }

        .summary-left h3 {
          font-size: 32px;
          color: var(--color-text);
          margin: 4px 0;
        }

        .summary-lbl {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 13px;
          text-transform: uppercase;
          color: var(--color-text-muted);
        }

        .summary-sub {
          font-size: 13px;
          color: var(--color-text-muted);
        }

        .spend-chart-section {
          margin-bottom: 28px;
        }

        .spend-chart-section h4 {
          margin-bottom: 14px;
          font-family: var(--font-display);
        }

        .chart-bars-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .chart-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .chart-member-label {
          width: 90px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 14px;
        }

        .chart-member-label img {
          width: 24px;
          height: 24px;
          border-radius: 50%;
        }

        .chart-bar-track {
          flex: 1;
          height: 32px;
          background-color: var(--color-surface-container-low);
          border-radius: 16px;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
        }

        .chart-bar-fill {
          height: 100%;
          border-radius: 16px;
          transition: width 0.3s;
        }

        .bar-val {
          position: absolute;
          right: 12px;
          font-size: 13px;
          font-weight: 700;
        }

        /* Debts */
        .debts-section {
          margin-bottom: 28px;
          background: var(--color-surface-container-low);
          border-radius: 20px;
          padding: 20px;
        }

        .debts-section h4 {
          margin-bottom: 12px;
        }

        .debts-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .debt-row-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: white;
          padding: 10px 16px;
          border-radius: 14px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.03);
        }

        .debt-avatars {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .avatar-side {
          width: 28px;
          height: 28px;
          border-radius: 50%;
        }

        .arrow-icon {
          color: var(--color-text-muted);
        }

        .debt-message {
          font-size: 13px;
          flex: 1;
          margin-left: 12px;
        }

        .debt-badge {
          background-color: #fbe6eb;
          color: var(--color-blush);
          padding: 4px 12px;
          border-radius: 9999px;
          font-weight: 700;
          font-size: 13px;
        }

        /* Expense list */
        .expense-history-list h4 {
          margin-bottom: 14px;
        }

        .expenses-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .expense-row-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-radius: 16px;
          background-color: var(--color-surface-container-lowest);
          border: 1px solid var(--color-surface-container-high);
        }

        .payer-col {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .payer-col img {
          width: 36px;
          height: 36px;
          border-radius: 50%;
        }

        .exp-desc {
          font-weight: 700;
          font-size: 15px;
        }

        .exp-meta {
          font-size: 12px;
          color: var(--color-text-muted);
        }

        .amount-col {
          font-weight: 700;
          font-size: 16px;
          color: var(--color-text);
        }

        /* Lightbox Fullscreen Viewer */
        .lightbox-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(46, 42, 40, 0.95);
          z-index: 3000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .lightbox-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: none;
          border: none;
          color: white;
          cursor: pointer;
        }

        .lightbox-container {
          position: relative;
          max-width: 90vw;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .lightbox-img {
          max-width: 100%;
          max-height: 70vh;
          object-fit: contain;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }

        .lightbox-top-bar {
          position: absolute;
          top: -60px;
          left: 0;
          display: flex;
          align-items: center;
          gap: 10px;
          color: white;
        }

        .light-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
        }

        .light-author {
          font-size: 13px;
          font-weight: 700;
        }

        .light-time {
          font-size: 11px;
          opacity: 0.7;
        }

        .lightbox-bottom-bar {
          margin-top: 16px;
          display: flex;
          gap: 20px;
        }

        .light-action-btn {
          background: rgba(255, 255, 255, 0.15);
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-weight: 700;
          font-size: 13px;
          font-family: var(--font-display);
        }

        .light-action-btn:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        .light-action-btn.delete-btn {
          color: #ffb1c1;
        }

        /* Add Note Modal Custom styles */
        .note-textarea {
          width: 100%;
          height: 120px;
          background-color: var(--color-surface-container-low);
          border: 2px solid transparent;
          border-radius: 14px;
          padding: 12px;
          font-family: var(--font-body);
          outline: none;
          resize: none;
          margin-top: 12px;
        }

        .note-textarea:focus {
          border-color: var(--color-blush);
          background-color: white;
        }

        .color-picker-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 14px;
        }

        .picker-lbl {
          font-size: 14px;
          font-weight: 700;
        }

        .color-options {
          display: flex;
          gap: 8px;
        }

        .color-dot {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
        }

        .color-dot.note-butter { background-color: #fcf1d3; }
        .color-dot.note-blush { background-color: #fbe6eb; }
        .color-dot.note-sea { background-color: #e6f0fa; }

        .color-dot.active {
          border-color: var(--color-text);
        }

        .modal-btn-row {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }

        /* Add Expense Custom Styles */
        .amount-input-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 20px;
          border-bottom: 2px solid var(--color-blush);
          padding-bottom: 8px;
        }

        .currency-lbl {
          font-size: 32px;
          font-weight: 700;
          color: var(--color-blush);
        }

        .giant-amount-input {
          font-size: 40px;
          font-weight: 700;
          border: none;
          background: transparent;
          width: 150px;
          text-align: center;
          outline: none;
          font-family: var(--font-display);
        }

        .input-group-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .input-group-field label {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 14px;
        }

        .payer-chips {
          display: flex;
          gap: 8px;
        }

        .payer-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          background-color: var(--color-surface-container-low);
          padding: 6px 12px;
          border-radius: 9999px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 700;
          border: 1.5px solid transparent;
        }

        .payer-chip.active {
          border-color: var(--color-blush);
          background-color: #fbe6eb;
        }

        .payer-chip img {
          width: 20px;
          height: 20px;
          border-radius: 50%;
        }

        .split-summary-badge {
          background-color: #e5ecd6;
          color: var(--color-matcha);
          padding: 8px 12px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          text-align: center;
          margin: 12px 0;
        }

        /* Bottom sheet mock upload */
        .bottom-sheet-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.3);
          z-index: 2500;
        }

        .bottom-sheet {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background-color: var(--color-surface-container-lowest);
          border-radius: 24px 24px 0 0;
          padding: 24px;
          box-shadow: 0 -10px 30px rgba(0,0,0,0.1);
          z-index: 2501;
        }

        .sheet-options {
          display: flex;
          gap: 16px;
          margin: 20px 0;
        }

        .sheet-option-card {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          background-color: var(--color-surface-container-low);
          border-radius: 12px;
          padding: 12px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .sheet-option-card:hover {
          background-color: var(--color-surface-container);
        }

        .sheet-option-card img {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 8px;
        }

        .sheet-option-card span {
          font-size: 12px;
          font-weight: 700;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        @media (max-width: 650px) {
          .segmented-tab-bar {
            flex-wrap: wrap;
          }

          .tab-btn span {
            display: none;
          }

          .tab-btn {
            padding: 8px;
          }

          .masonry-gallery {
            grid-template-columns: repeat(2, 1fr);
          }

          .gallery-item.span-2 {
            grid-column: span 2;
          }
        }
      `}</style>
    </Layout>
  )
}
