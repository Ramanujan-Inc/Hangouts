import React, { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { Camera, MapPin, Calendar, Clock, Check, Users, Sparkles } from 'lucide-react'

// Cover illustrations
const placeholders = [
  { name: 'Bonfire Vibe', url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80' },
  { name: 'Picnic Park', url: 'https://images.unsplash.com/photo-1526218626217-dc65a29bb444?auto=format&fit=crop&w=600&q=80' },
  { name: 'City Night Lights', url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80' },
  { name: 'Sunny Beach', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80' }
]

// Mock friends
const initialRoster = [
  { id: 'jam', name: 'Jam', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=jam' },
  { id: 'dave', name: 'Dave', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=dave' },
  { id: 'chloe', name: 'Chloe', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=chloe' },
]

export default function CreateHangout() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  
  // Custom illustrated cover picker
  const [currentCoverIndex, setCurrentCoverIndex] = useState(-1)
  
  // Map/Location mock modal
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [searchLocationQuery, setSearchLocationQuery] = useState('')

  const handleSelectAll = () => {
    if (selectedParticipants.length === initialRoster.length) {
      setSelectedParticipants([])
    } else {
      setSelectedParticipants(initialRoster.map(m => m.id))
    }
  }

  const toggleParticipant = (id: string) => {
    if (selectedParticipants.includes(id)) {
      setSelectedParticipants(selectedParticipants.filter(p => p !== id))
    } else {
      setSelectedParticipants([...selectedParticipants, id])
    }
  }

  const cycleCover = () => {
    setCurrentCoverIndex((prev) => (prev + 1) % placeholders.length)
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    // In real app, we would push to state/DB. 
    // Here we'll redirect back to timeline.
    router.push('/timeline')
  }

  return (
    <Layout>
      <Head>
        <title>New Hangout | Hangout</title>
      </Head>

      <div className="create-hangout-page">
        <h2 className="page-heading">Create a Hangout</h2>
        
        <form onSubmit={handleCreate} className="create-form">
          {/* Cover Photo Picker */}
          <div className="cover-picker-section">
            <div 
              className="cover-picker-box"
              onClick={cycleCover}
              style={{
                backgroundImage: currentCoverIndex >= 0 ? `url(${placeholders[currentCoverIndex].url})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {currentCoverIndex === -1 ? (
                <div className="picker-empty-content">
                  <div className="camera-circle">
                    <Camera size={24} />
                  </div>
                  <span>Add a cover photo</span>
                  <p className="hint">Click to cycle throughIllustrated Vibe Covers</p>
                </div>
              ) : (
                <div className="picker-overlay">
                  <span>Vibe: {placeholders[currentCoverIndex].name} (Tap to change)</span>
                </div>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="form-fields">
            <div className="input-group">
              <label>Hangout Title</label>
              <input 
                type="text" 
                required 
                className="pill-input" 
                placeholder="e.g. Friday Night Ramen"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Description</label>
              <textarea 
                className="description-box"
                placeholder="What are we doing? Write down any notes or plans..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Date & Time Row */}
            <div className="datetime-row">
              <div className="input-group half-width">
                <label><Calendar size={16} /> Date</label>
                <input 
                  type="date" 
                  required 
                  className="pill-input" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="input-group half-width">
                <label><Clock size={16} /> Time</label>
                <input 
                  type="time" 
                  className="pill-input" 
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            {/* Location Selector */}
            <div className="input-group">
              <label><MapPin size={16} /> Location</label>
              <div className="location-picker-trigger" onClick={() => setShowLocationPicker(true)}>
                <MapPin size={18} className="loc-pin" />
                <span>{location || 'Add a location...'}</span>
              </div>
            </div>

            {/* Participants Selector */}
            <div className="input-group">
              <div className="label-row-with-action">
                <label><Users size={16} /> Participants</label>
                <span className="action-text" onClick={handleSelectAll}>
                  {selectedParticipants.length === initialRoster.length ? 'Deselect All' : 'Select All'}
                </span>
              </div>
              
              <div className="participants-scroll">
                {initialRoster.map((member) => {
                  const isSelected = selectedParticipants.includes(member.id)
                  return (
                    <div 
                      key={member.id}
                      className={`participant-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleParticipant(member.id)}
                    >
                      <div className="avatar-wrapper">
                        <img src={member.avatar} alt={member.name} />
                        {isSelected && (
                          <div className="check-badge">
                            <Check size={8} strokeWidth={4} />
                          </div>
                        )}
                      </div>
                      <span className="chip-name">{member.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Sticky Bottom CTA */}
          <div className="sticky-cta-footer">
            <button type="submit" className="pill-button pill-button-primary full-width-btn">
              <Sparkles size={18} />
              Create Hangout
            </button>
          </div>
        </form>

        {/* Location Picker Mock Modal */}
        {showLocationPicker && (
          <div className="modal-backdrop">
            <div className="modal-content">
              <h3>Search & Select Location</h3>
              <div className="search-bar-wrapper">
                <input 
                  type="text" 
                  className="pill-input" 
                  placeholder="Search a place (e.g. Ramen Nagi, BGC)"
                  value={searchLocationQuery}
                  onChange={(e) => setSearchLocationQuery(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Mock map geocoding results */}
              <div className="mock-results">
                {[
                  { name: 'Ramen Nagi, Bonifacio High Street', desc: 'BGC, Taguig City' },
                  { name: 'Wildflour Cafe, Net Lima', desc: 'BGC, Taguig City' },
                  { name: 'Anawangin Cove Campground', desc: 'San Antonio, Zambales' },
                  { name: 'Mika\'s House Backyard', desc: 'Quezon City, Manila' }
                ].filter(r => r.name.toLowerCase().includes(searchLocationQuery.toLowerCase()) || r.desc.toLowerCase().includes(searchLocationQuery.toLowerCase()))
                 .map((res, i) => (
                  <div 
                    key={i} 
                    className="result-row"
                    onClick={() => {
                      setLocation(res.name)
                      setShowLocationPicker(false)
                    }}
                  >
                    <MapPin size={16} />
                    <div>
                      <div className="result-name">{res.name}</div>
                      <div className="result-desc">{res.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                type="button" 
                className="pill-button pill-button-secondary close-modal-btn"
                onClick={() => setShowLocationPicker(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .create-hangout-page {
          max-width: 600px;
          margin: 0 auto;
          position: relative;
        }

        .page-heading {
          font-size: 28px;
          margin-bottom: 24px;
          font-family: var(--font-display);
        }

        .create-form {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .cover-picker-section {
          width: 100%;
        }

        .cover-picker-box {
          height: 180px;
          border-radius: 20px;
          border: 2px dashed var(--color-outline-variant);
          background-color: var(--color-surface-container);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s, transform 0.2s;
        }

        .cover-picker-box:hover {
          border-color: var(--color-blush);
          transform: translateY(-2px);
        }

        .picker-empty-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: var(--color-text-muted);
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 14px;
        }

        .camera-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: var(--color-surface-container-lowest);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-tangerine);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
        }

        .hint {
          font-size: 11px;
          opacity: 0.8;
          font-weight: normal;
        }

        .picker-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(46, 42, 40, 0.6);
          padding: 8px 16px;
          color: white;
          font-size: 13px;
          font-family: var(--font-display);
          font-weight: 700;
          text-align: center;
        }

        .form-fields {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group label {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 14px;
          color: var(--color-text);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .description-box {
          width: 100%;
          height: 100px;
          background-color: var(--color-surface-container-low);
          border: 2px solid transparent;
          color: var(--color-text);
          font-family: var(--font-body);
          padding: 12px 16px;
          border-radius: 18px;
          outline: none;
          font-size: 16px;
          resize: none;
          transition: border-color 0.2s, background-color 0.2s;
        }

        .description-box:focus {
          border-color: var(--color-blush);
          background-color: var(--color-surface-container-lowest);
        }

        .datetime-row {
          display: flex;
          gap: 16px;
        }

        .half-width {
          flex: 1;
        }

        .location-picker-trigger {
          display: flex;
          align-items: center;
          gap: 12px;
          background-color: var(--color-surface-container-low);
          border-radius: 9999px;
          padding: 12px 20px;
          cursor: pointer;
          border: 2px solid transparent;
          color: var(--color-text-muted);
          transition: background-color 0.2s, border-color 0.2s;
        }

        .location-picker-trigger:hover {
          background-color: var(--color-surface-container-high);
          border-color: var(--color-outline-variant);
        }

        .loc-pin {
          color: var(--color-sea);
        }

        .label-row-with-action {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .action-text {
          font-size: 13px;
          color: var(--color-sea);
          font-weight: 700;
          cursor: pointer;
        }

        .participants-scroll {
          display: flex;
          gap: 14px;
          padding: 8px 0;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .participants-scroll::-webkit-scrollbar {
          display: none;
        }

        .participant-chip {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          width: 72px;
        }

        .avatar-wrapper {
          position: relative;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background-color: var(--color-surface-container);
          border: 2px solid transparent;
          transition: border-color 0.2s;
        }

        .participant-chip.selected .avatar-wrapper {
          border-color: var(--color-blush);
        }

        .avatar-wrapper img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
        }

        .check-badge {
          position: absolute;
          bottom: 0;
          right: 0;
          background-color: var(--color-blush);
          color: white;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid white;
        }

        .chip-name {
          font-size: 13px;
          color: var(--color-text-muted);
          font-weight: 600;
        }

        .sticky-cta-footer {
          margin-top: 12px;
          padding-bottom: 24px;
        }

        .full-width-btn {
          width: 100%;
        }

        /* Modal styling */
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(46, 42, 40, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 20px;
        }

        .modal-content {
          background-color: var(--color-surface-container-lowest);
          border-radius: 28px;
          width: 100%;
          max-width: 440px;
          padding: 24px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          border: 1px solid var(--color-surface-container-high);
        }

        .modal-content h3 {
          font-size: 20px;
          margin-bottom: 16px;
        }

        .search-bar-wrapper {
          margin-bottom: 16px;
        }

        .mock-results {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 200px;
          overflow-y: auto;
          margin-bottom: 20px;
        }

        .result-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 12px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .result-row:hover {
          background-color: var(--color-surface-container-low);
        }

        .result-name {
          font-weight: 700;
          font-size: 14px;
        }

        .result-desc {
          font-size: 12px;
          color: var(--color-text-muted);
        }

        .close-modal-btn {
          width: 100%;
        }
      `}</style>
    </Layout>
  )
}
