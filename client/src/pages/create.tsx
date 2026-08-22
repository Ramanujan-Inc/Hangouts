import React, { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import {
  Camera,
  MapPin,
  Calendar,
  Clock,
  Check,
  Users,
  Sparkles,
  Star,
  Trash2,
  Navigation,
  Loader2,
  ChevronDown,
  Image as ImageIcon,
  Plus,
} from 'lucide-react'
import { Button, Modal, TextArea, TextField, InlineAlert } from '../components/ui'

interface GroupMemberProfile {
  id: string
  username: string
  avatar_url?: string | null
}

interface GroupMember {
  id: string
  user_id: string
  status: string
  profile?: GroupMemberProfile | null
}

interface Group {
  id: string
  name: string
  cover_image_url?: string | null
  members?: GroupMember[]
}

interface HangoutResponse {
  id: string
  title: string
  hangout_date: string
  cover_photo_url?: string | null
}

interface UploadedPhoto {
  id: string
  file: File
  previewUrl: string
}

interface SuggestedSpot {
  name: string
  desc: string
  lat: number
  lng: number
}

const SUGGESTED_SPOTS: SuggestedSpot[] = [
  { name: 'Ramen Nagi, Bonifacio High Street', desc: 'BGC, Taguig City', lat: 14.5517, lng: 121.0505 },
  { name: 'Wildflour Cafe + Bakery, Net Lima', desc: 'BGC, Taguig City', lat: 14.5492, lng: 121.0478 },
  { name: 'Ayala Triangle Gardens', desc: 'Makati Central Business District', lat: 14.5574, lng: 121.0232 },
  { name: 'Intramuros Historic District', desc: 'Manila City', lat: 14.5898, lng: 120.9734 },
  { name: 'UP Sunken Garden', desc: 'Diliman, Quezon City', lat: 14.6538, lng: 121.0685 },
  { name: 'SM Mall of Asia Bay Area', desc: 'Pasay City', lat: 14.5352, lng: 120.9822 },
  { name: 'Camp Netanya Resort', desc: 'Anilao, Batangas', lat: 13.7565, lng: 120.8931 },
  { name: 'Tagaytay Ridge Overlook', desc: 'Tagaytay, Cavite', lat: 14.1153, lng: 120.9621 },
]

export default function CreateHangout() {
  const router = useRouter()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form Fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [showTimeInput, setShowTimeInput] = useState(false)
  const [locationName, setLocationName] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)

  // Group & Participant Management
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [allCircleMembers, setAllCircleMembers] = useState<GroupMemberProfile[]>([])
  const [groupMembers, setGroupMembers] = useState<GroupMemberProfile[]>([])
  const [customAttendees, setCustomAttendees] = useState<GroupMemberProfile[]>([])
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  // Attendee Username Search Modal
  const [showAddAttendeeModal, setShowAddAttendeeModal] = useState(false)
  const [attendeeSearchQuery, setAttendeeSearchQuery] = useState('')
  const [searchingUser, setSearchingUser] = useState(false)
  const [searchUserResult, setSearchUserResult] = useState<GroupMemberProfile | null>(null)
  const [searchUserError, setSearchUserError] = useState<string | null>(null)

  // Multi-Photo Upload & Cover Photo Selection
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([])
  const [selectedCoverIndex, setSelectedCoverIndex] = useState<number>(-1)

  // Location Picker Modal
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [searchLocationQuery, setSearchLocationQuery] = useState('')
  const [customCoordsMode, setCustomCoordsMode] = useState(false)
  const [manualLat, setManualLat] = useState('')
  const [manualLng, setManualLng] = useState('')

  // Submission & Validation State
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Fetch user groups and all known group circle members on mount
  useEffect(() => {
    async function loadGroupsAndMembers() {
      try {
        setLoadingMembers(true)
        const data = await api.get<Group[]>('/groups')
        setGroups(data || [])

        // Collect all distinct members across all groups the user belongs to
        const knownMembersMap = new Map<string, GroupMemberProfile>()
        for (const grp of data || []) {
          try {
            const groupDetails = await api.get<Group>(`/groups/${grp.id}`)
            if (groupDetails && groupDetails.members) {
              for (const m of groupDetails.members) {
                if (m.status === 'accepted' && m.profile && m.profile.id !== user?.id) {
                  knownMembersMap.set(m.profile.id, m.profile)
                }
              }
            }
          } catch (e) {
            // Ignore individual group fetch failure
          }
        }
        setAllCircleMembers(Array.from(knownMembersMap.values()))
      } catch (err) {
        console.error('Failed to load groups and members:', err)
      } finally {
        setLoadingMembers(false)
      }
    }
    loadGroupsAndMembers()
  }, [user?.id])

  // When group selection changes, fetch that group's active members
  useEffect(() => {
    async function loadGroupMembers() {
      if (!selectedGroupId) {
        setGroupMembers([])
        return
      }
      try {
        setLoadingMembers(true)
        const groupDetails = await api.get<Group>(`/groups/${selectedGroupId}`)
        if (groupDetails && groupDetails.members) {
          const membersList = groupDetails.members
            .filter((m) => m.status === 'accepted' && m.profile && m.profile.id !== user?.id)
            .map((m) => m.profile as GroupMemberProfile)
          setGroupMembers(membersList)
          // Default: select all group members
          setSelectedParticipants(membersList.map((m) => m.id))
        } else {
          setGroupMembers([])
        }
      } catch (err) {
        console.error('Failed to load group members:', err)
        setGroupMembers([])
      } finally {
        setLoadingMembers(false)
      }
    }
    loadGroupMembers()
  }, [selectedGroupId, user?.id])

  // Handle Photo File Upload
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newPhotos: UploadedPhoto[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const previewUrl = URL.createObjectURL(file)
      newPhotos.push({
        id: `${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl,
      })
    }

    setUploadedPhotos((prev) => {
      const updated = [...prev, ...newPhotos]
      if (selectedCoverIndex === -1 && updated.length > 0) {
        setSelectedCoverIndex(0)
      }
      return updated
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemovePhoto = (indexToRemove: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setUploadedPhotos((prev) => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove)
      if (updated.length === 0) {
        setSelectedCoverIndex(-1)
      } else if (selectedCoverIndex === indexToRemove) {
        setSelectedCoverIndex(0)
      } else if (selectedCoverIndex > indexToRemove) {
        setSelectedCoverIndex(selectedCoverIndex - 1)
      }
      return updated
    })
  }

  // Toggle Member Attendees
  const handleToggleParticipant = (memberId: string) => {
    if (selectedParticipants.includes(memberId)) {
      setSelectedParticipants(selectedParticipants.filter((id) => id !== memberId))
    } else {
      setSelectedParticipants([...selectedParticipants, memberId])
    }
  }

  // Exact Match Search for User by Username
  const handleSearchExactUser = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = attendeeSearchQuery.trim()
    if (!trimmed) return

    setSearchUserError(null)
    setSearchUserResult(null)
    setSearchingUser(true)

    try {
      const profile = await api.get<GroupMemberProfile>(`/profiles/${encodeURIComponent(trimmed)}`)
      if (profile && profile.username.toLowerCase() === trimmed.toLowerCase()) {
        if (user && profile.id === user.id) {
          setSearchUserError('You are the host of this hangout.')
        } else {
          setSearchUserResult(profile)
        }
      } else {
        setSearchUserError(`No user found with exact username "${trimmed}".`)
      }
    } catch (err: any) {
      setSearchUserError(`No user found with exact username "${trimmed}".`)
    } finally {
      setSearchingUser(false)
    }
  }

  const handleAddFoundUser = (profile: GroupMemberProfile) => {
    if (!customAttendees.some((m) => m.id === profile.id)) {
      setCustomAttendees((prev) => [...prev, profile])
    }
    if (!selectedParticipants.includes(profile.id)) {
      setSelectedParticipants((prev) => [...prev, profile.id])
    }
    setShowAddAttendeeModal(false)
    setAttendeeSearchQuery('')
    setSearchUserResult(null)
    setSearchUserError(null)
  }

  // Consolidated active list of attendees
  const activeMembersList = selectedGroupId
    ? groupMembers
    : [
        ...allCircleMembers,
        ...customAttendees.filter((custom) => !allCircleMembers.some((m) => m.id === custom.id)),
      ]

  const handleSelectAllParticipants = () => {
    if (selectedParticipants.length === activeMembersList.length) {
      setSelectedParticipants([])
    } else {
      setSelectedParticipants(activeMembersList.map((m) => m.id))
    }
  }

  // Location Geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude)
        setLongitude(pos.coords.longitude)
        if (!locationName) {
          setLocationName('Current Location (GPS)')
        }
        setShowLocationPicker(false)
      },
      (err) => {
        alert(`Failed to retrieve GPS location: ${err.message}`)
      }
    )
  }

  const handleSelectSuggestedSpot = (spot: SuggestedSpot) => {
    setLocationName(spot.name)
    setLatitude(spot.lat)
    setLongitude(spot.lng)
    setShowLocationPicker(false)
  }

  const handleApplyManualCoords = () => {
    const parsedLat = parseFloat(manualLat)
    const parsedLng = parseFloat(manualLng)
    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      alert('Please enter valid numerical latitude and longitude.')
      return
    }
    setLatitude(parsedLat)
    setLongitude(parsedLng)
    if (!locationName) {
      setLocationName(`Coordinates: ${parsedLat.toFixed(4)}, ${parsedLng.toFixed(4)}`)
    }
    setShowLocationPicker(false)
  }

  // Form Submission
  const handleCreateHangout = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!title.trim()) {
      setErrorMessage('Please enter a hangout title.')
      return
    }
    if (!date) {
      setErrorMessage('Please select a date for the hangout.')
      return
    }

    try {
      setSubmitting(true)

      // 1. Resolve Cover Photo URL
      let coverPhotoUrl: string | undefined = undefined

      if (selectedCoverIndex >= 0 && uploadedPhotos[selectedCoverIndex]) {
        const coverPhoto = uploadedPhotos[selectedCoverIndex]
        const coverForm = new FormData()
        coverForm.append('file', coverPhoto.file)
        const coverRes = await api.post<{ url: string }>('/hangouts/cover', coverForm)
        coverPhotoUrl = coverRes.url
      }

      // 2. Create the Hangout record
      const hangoutPayload = {
        title: title.trim(),
        description: description.trim() || undefined,
        hangout_date: date,
        hangout_time: time ? `${time}:00` : undefined,
        location_name: locationName.trim() || undefined,
        latitude: latitude !== null ? latitude : undefined,
        longitude: longitude !== null ? longitude : undefined,
        cover_photo_url: coverPhotoUrl,
        group_id: selectedGroupId || undefined,
      }

      const createdHangout = await api.post<HangoutResponse>('/hangouts', hangoutPayload)
      const hangoutId = createdHangout.id

      // 3. Upload all attached photos into the hangout's media album
      if (uploadedPhotos.length > 0) {
        for (const photo of uploadedPhotos) {
          try {
            const mediaForm = new FormData()
            mediaForm.append('file', photo.file)
            mediaForm.append('is_shared', 'true')
            await api.post(`/hangouts/${hangoutId}/media`, mediaForm)
          } catch (uploadErr) {
            console.warn('Failed to upload media item:', uploadErr)
          }
        }
      }

      // 4. Add additional selected participants
      if (selectedParticipants.length > 0 && user) {
        for (const participantId of selectedParticipants) {
          if (participantId !== user.id) {
            try {
              await api.post(`/hangouts/${hangoutId}/participants`, { user_id: participantId })
            } catch (partErr) {
              console.warn(`Failed to add participant ${participantId}:`, partErr)
            }
          }
        }
      }

      // 5. Navigate to the newly created hangout page
      router.push(`/hangout/${hangoutId}`)
    } catch (err: any) {
      console.error('Failed to create hangout:', err)
      const errorDetail =
        err?.response?.data?.detail ||
        err?.message ||
        'Unable to create hangout. Please verify your inputs and try again.'
      setErrorMessage(typeof errorDetail === 'string' ? errorDetail : JSON.stringify(errorDetail))
    } finally {
      setSubmitting(false)
    }
  }

  const activeCoverUrl =
    selectedCoverIndex >= 0 && uploadedPhotos[selectedCoverIndex]
      ? uploadedPhotos[selectedCoverIndex].previewUrl
      : ''

  return (
    <ProtectedRoute>
      <Layout>
        <Head>
          <title>New Hangout | Hangout</title>
        </Head>

        <div className="create-hangout-page">
          <header className="page-header">
            <h2 className="page-heading">Create a Hangout</h2>
            <p className="page-subheading">Capture memories, add pictures, and organize your scrapbook.</p>
          </header>

          {errorMessage && <InlineAlert>{errorMessage}</InlineAlert>}

          <form onSubmit={handleCreateHangout} className="create-form">
            {/* Cover Photo & Multi-Picture Upload Section */}
            <div className="cover-picker-section">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                multiple
                onChange={handlePhotoSelect}
                style={{ display: 'none' }}
              />

              <div
                className={`cover-picker-box ${uploadedPhotos.length > 0 ? 'has-cover' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  backgroundImage: activeCoverUrl ? `url(${activeCoverUrl})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {uploadedPhotos.length === 0 ? (
                  <div className="picker-empty-content">
                    <div className="camera-circle">
                      <Camera size={24} />
                    </div>
                    <span>Upload pictures</span>
                    <p className="hint">Click or tap to upload pictures, and choose your cover photo</p>
                  </div>
                ) : (
                  <div className="picker-overlay">
                    <div className="cover-badge">
                      <Star size={14} fill="currentColor" />
                      <span>Cover Photo #{selectedCoverIndex + 1} (Tap to upload more)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Uploaded Photos Strip & Cover Selector */}
              {uploadedPhotos.length > 0 && (
                <div className="uploaded-strip-section">
                  <div className="strip-header">
                    <span className="strip-title">
                      <ImageIcon size={14} /> Uploaded Pictures (Tap to set as Cover Photo)
                    </span>
                    <span className="strip-count">
                      {uploadedPhotos.length} photo{uploadedPhotos.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="photos-strip">
                    {uploadedPhotos.map((photo, idx) => {
                      const isCover = selectedCoverIndex === idx
                      return (
                        <div
                          key={photo.id}
                          className={`photo-thumb-card ${isCover ? 'is-cover' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedCoverIndex(idx)
                          }}
                          title={isCover ? 'Active Cover Photo' : 'Click to make this the cover photo'}
                        >
                          <img src={photo.previewUrl} alt={`Upload ${idx + 1}`} />

                          {isCover && (
                            <div className="cover-tag">
                              <Star size={10} fill="white" />
                              <span>Cover</span>
                            </div>
                          )}

                          <button
                            type="button"
                            className="remove-photo-btn"
                            onClick={(e) => handleRemovePhoto(idx, e)}
                            title="Remove picture"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )
                    })}

                    <div
                      className="photo-thumb-card add-more-card"
                      onClick={() => fileInputRef.current?.click()}
                      title="Upload more photos"
                    >
                      <Plus size={20} />
                      <span>Add</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="form-fields">
              <TextField
                label="Hangout Title"
                required
                placeholder="e.g. Friday Night Ramen"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <TextArea
                label="Description & Scrapbook Notes"
                placeholder="What are we doing? Write down any notes, funny moments, or plans..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              {/* Group Selection Dropdown */}
              <div className="input-group">
                <label className="field-label">
                  <Users size={16} /> Group Circle
                </label>
                <div className="select-container">
                  <select
                    className="pill-input select-input"
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                  >
                    <option value="">Personal / Standalone Hangout (No Group)</option>
                    {groups.map((grp) => (
                      <option key={grp.id} value={grp.id}>
                        {grp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Attendees Participant Selector (Directly adjacent to Group Circle) */}
              <div className="input-group">
                <div className="label-row-with-action">
                  <label className="field-label">
                    <Users size={16} /> Attendees
                  </label>
                  {activeMembersList.length > 0 && (
                    <span className="action-text" onClick={handleSelectAllParticipants}>
                      {selectedParticipants.length === activeMembersList.length ? 'Deselect All' : 'Select All'}
                    </span>
                  )}
                </div>

                {loadingMembers ? (
                  <div className="members-loading">
                    <Loader2 size={16} className="spin-icon" />
                    <span>Loading attendees...</span>
                  </div>
                ) : activeMembersList.length === 0 ? (
                  <div className="empty-attendees-card">
                    <p className="no-members-hint">
                      {selectedGroupId
                        ? 'No other members in this group yet.'
                        : 'No circle members found.'}
                    </p>
                    {!selectedGroupId && (
                      <button
                        type="button"
                        className="add-by-username-btn"
                        onClick={() => setShowAddAttendeeModal(true)}
                      >
                        <Plus size={14} />
                        <span>Search & Add User by Username</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="participants-scroll">
                    {activeMembersList.map((member) => {
                      const isSelected = selectedParticipants.includes(member.id)
                      const avatarUrl =
                        member.avatar_url ||
                        `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(member.username)}`
                      return (
                        <div
                          key={member.id}
                          className={`participant-chip ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleToggleParticipant(member.id)}
                        >
                          <div className="avatar-wrapper">
                            <img src={avatarUrl} alt={member.username} />
                            {isSelected && (
                              <div className="check-badge">
                                <Check size={8} strokeWidth={4} />
                              </div>
                            )}
                          </div>
                          <span className="chip-name">{member.username}</span>
                        </div>
                      )
                    })}

                    {!selectedGroupId && (
                      <div
                        className="participant-chip add-more-chip"
                        onClick={() => setShowAddAttendeeModal(true)}
                        title="Search & add user by username"
                      >
                        <div className="avatar-wrapper add-avatar">
                          <Plus size={20} />
                        </div>
                        <span className="chip-name">Add User</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Date & Optional Time Row */}
              <div className="input-group">
                <div className="label-row-with-action">
                  <label className="field-label">
                    <Calendar size={16} /> Date
                  </label>
                  {!showTimeInput ? (
                    <span
                      className="action-text add-time-action"
                      onClick={() => setShowTimeInput(true)}
                    >
                      <Clock size={13} /> + Add time
                    </span>
                  ) : (
                    <span
                      className="action-text remove-time-action"
                      onClick={() => {
                        setShowTimeInput(false)
                        setTime('')
                      }}
                    >
                      Remove time
                    </span>
                  )}
                </div>

                {showTimeInput ? (
                  <div className="datetime-row">
                    <TextField
                      icon={<Calendar size={16} />}
                      type="date"
                      required
                      wrapperClassName="half-width"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                    <TextField
                      icon={<Clock size={16} />}
                      type="time"
                      placeholder="Select time"
                      wrapperClassName="half-width"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                  </div>
                ) : (
                  <TextField
                    icon={<Calendar size={16} />}
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                )}
              </div>

              {/* Location & Coordinates Picker */}
              <div className="input-group">
                <label className="field-label">
                  <MapPin size={16} /> Location & Coordinates
                </label>
                <div className="location-picker-trigger" onClick={() => setShowLocationPicker(true)}>
                  <MapPin size={18} className="loc-pin" />
                  <div className="loc-text-col">
                    <span className="loc-main">{locationName || 'Add a location or venue...'}</span>
                    {latitude !== null && longitude !== null && (
                      <span className="loc-coords">
                        GPS: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Action CTA */}
            <div className="sticky-cta-footer">
              <Button type="submit" fullWidth disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 size={18} className="spin-icon" />
                    <span>Creating Hangout...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Create Hangout</span>
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Location & Coordinates Picker Modal */}
          {showLocationPicker && (
            <Modal onClose={() => setShowLocationPicker(false)} title="Select Location & Coordinates">
              <div className="location-modal-body">
                {/* Search Bar */}
                <div className="search-input-row">
                  <input
                    type="text"
                    className="pill-input"
                    placeholder="Search place name (e.g. Ramen Nagi, BGC)"
                    value={searchLocationQuery}
                    onChange={(e) => setSearchLocationQuery(e.target.value)}
                    autoFocus
                  />
                </div>

                {/* Quick GPS Geolocation Button */}
                <button type="button" className="gps-action-btn" onClick={handleUseCurrentLocation}>
                  <Navigation size={16} />
                  <span>Use My Current GPS Location</span>
                </button>

                {/* Popular Suggested Hangout Spots */}
                <div className="section-title">Suggested Places with Coordinates</div>
                <div className="suggested-results">
                  {SUGGESTED_SPOTS.filter(
                    (s) =>
                      s.name.toLowerCase().includes(searchLocationQuery.toLowerCase()) ||
                      s.desc.toLowerCase().includes(searchLocationQuery.toLowerCase())
                  ).map((spot, i) => (
                    <div
                      key={i}
                      className="spot-result-row"
                      onClick={() => handleSelectSuggestedSpot(spot)}
                    >
                      <MapPin size={18} className="spot-pin-icon" />
                      <div className="spot-details">
                        <div className="spot-name">{spot.name}</div>
                        <div className="spot-desc">{spot.desc}</div>
                        <div className="spot-coords-tag">
                          {spot.lat.toFixed(4)}, {spot.lng.toFixed(4)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Manual Coordinates Toggle */}
                <div className="custom-coords-toggle">
                  <button
                    type="button"
                    className="toggle-link"
                    onClick={() => setCustomCoordsMode(!customCoordsMode)}
                  >
                    <span>{customCoordsMode ? 'Hide custom coordinate inputs' : 'Enter custom latitude / longitude manually'}</span>
                    <ChevronDown
                      size={14}
                      style={{
                        transform: customCoordsMode ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                      }}
                    />
                  </button>

                  {customCoordsMode && (
                    <div className="custom-coords-box">
                      <div className="coords-inputs-row">
                        <div className="coord-field">
                          <label>Latitude</label>
                          <input
                            type="number"
                            step="any"
                            className="pill-input"
                            placeholder="e.g. 14.5517"
                            value={manualLat}
                            onChange={(e) => setManualLat(e.target.value)}
                          />
                        </div>
                        <div className="coord-field">
                          <label>Longitude</label>
                          <input
                            type="number"
                            step="any"
                            className="pill-input"
                            placeholder="e.g. 121.0505"
                            value={manualLng}
                            onChange={(e) => setManualLng(e.target.value)}
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="small"
                        variant="secondary"
                        fullWidth
                        onClick={handleApplyManualCoords}
                      >
                        Apply Coordinates
                      </Button>
                    </div>
                  )}
                </div>

                <div className="modal-footer-btns">
                  <Button variant="secondary" fullWidth onClick={() => setShowLocationPicker(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </Modal>
          )}

          {/* Add Attendee by Username Modal (Exact Match Only) */}
          {showAddAttendeeModal && (
            <Modal
              onClose={() => {
                setShowAddAttendeeModal(false)
                setAttendeeSearchQuery('')
                setSearchUserResult(null)
                setSearchUserError(null)
              }}
              title="Add Attendee by Username"
            >
              <div className="user-search-modal-body">
                <p className="search-modal-subtitle">
                  Search by username to find and invite a user to this hangout.
                </p>

                <form onSubmit={handleSearchExactUser} className="search-input-form-row">
                  <input
                    type="text"
                    className="pill-input search-user-input"
                    placeholder="Enter username (e.g. mika)"
                    value={attendeeSearchQuery}
                    onChange={(e) => {
                      setAttendeeSearchQuery(e.target.value)
                      setSearchUserError(null)
                      setSearchUserResult(null)
                    }}
                    autoFocus
                  />
                  <Button
                    type="submit"
                    size="small"
                    variant="primary"
                    disabled={searchingUser || !attendeeSearchQuery.trim()}
                  >
                    {searchingUser ? <Loader2 size={16} className="spin-icon" /> : 'Search'}
                  </Button>
                </form>

                {searchUserError && (
                  <div className="search-user-error-alert">
                    <span>{searchUserError}</span>
                  </div>
                )}

                {searchUserResult && (
                  <div className="exact-match-result-card">
                    <div className="match-profile-info">
                      <img
                        src={
                          searchUserResult.avatar_url ||
                          `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(searchUserResult.username)}`
                        }
                        alt={searchUserResult.username}
                        className="match-avatar-img"
                      />
                      <div className="match-text-col">
                        <span className="match-username-text">@{searchUserResult.username}</span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="small"
                      variant={selectedParticipants.includes(searchUserResult.id) ? 'secondary' : 'primary'}
                      onClick={() => handleAddFoundUser(searchUserResult)}
                    >
                      {selectedParticipants.includes(searchUserResult.id) ? 'Added ✓' : '+ Add Attendee'}
                    </Button>
                  </div>
                )}

                <div className="modal-footer-btns">
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => {
                      setShowAddAttendeeModal(false)
                      setAttendeeSearchQuery('')
                      setSearchUserResult(null)
                      setSearchUserError(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Modal>
          )}
        </div>

        <style jsx>{`
          .create-hangout-page {
            max-width: 620px;
            margin: 0 auto;
            position: relative;
          }

          .page-header {
            margin-bottom: 24px;
          }

          .page-heading {
            font-size: 28px;
            font-weight: 800;
            font-family: var(--font-display);
            color: var(--color-text-main);
            margin: 0 0 6px 0;
          }

          .page-subheading {
            font-size: 14px;
            color: var(--color-text-muted);
            margin: 0;
          }

          .create-form {
            display: flex;
            flex-direction: column;
            gap: 28px;
          }

          /* Cover Photo Picker Box */
          .cover-picker-section {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }

          .cover-picker-box {
            height: 190px;
            border-radius: 24px;
            border: 2px dashed var(--color-outline-variant);
            background-color: var(--color-surface-container);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            position: relative;
            overflow: hidden;
            transition: all 0.2s ease;
          }

          .cover-picker-box:hover {
            border-color: var(--color-blush);
            transform: translateY(-2px);
          }

          .cover-picker-box.has-cover {
            border-style: solid;
            border-color: var(--color-surface-container-high);
            align-items: flex-end;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
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
            margin: 0;
          }

          .picker-overlay {
            width: 100%;
            padding: 12px 18px;
            background: linear-gradient(to top, rgba(0, 0, 0, 0.65) 0%, transparent 100%);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .cover-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(8px);
            padding: 6px 14px;
            border-radius: 9999px;
            color: white;
            font-size: 12px;
            font-weight: 700;
            font-family: var(--font-display);
          }

          /* Attached Photos Strip */
          .uploaded-strip-section {
            background-color: var(--color-surface-container-lowest);
            border: 1px solid var(--color-surface-container-high);
            border-radius: 18px;
            padding: 14px;
          }

          .strip-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          }

          .strip-title {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            font-weight: 700;
            color: var(--color-text-muted);
            font-family: var(--font-display);
          }

          .strip-count {
            font-size: 11px;
            font-weight: 700;
            color: var(--color-blush);
          }

          .photos-strip {
            display: flex;
            gap: 12px;
            overflow-x: auto;
            padding-bottom: 4px;
            scrollbar-width: thin;
          }

          .photo-thumb-card {
            position: relative;
            flex-shrink: 0;
            width: 80px;
            height: 80px;
            border-radius: 14px;
            overflow: hidden;
            border: 2px solid var(--color-surface-container-high);
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .photo-thumb-card:hover {
            transform: translateY(-2px);
            border-color: var(--color-outline);
          }

          .photo-thumb-card.is-cover {
            border-color: var(--color-blush);
            box-shadow: 0 0 0 2px var(--color-blush);
          }

          .photo-thumb-card img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .cover-tag {
            position: absolute;
            bottom: 4px;
            left: 4px;
            right: 4px;
            background-color: var(--color-blush);
            color: white;
            font-size: 9px;
            font-weight: 800;
            border-radius: 9999px;
            padding: 2px 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 2px;
            font-family: var(--font-display);
          }

          .remove-photo-btn {
            position: absolute;
            top: 4px;
            right: 4px;
            background: rgba(0, 0, 0, 0.6);
            color: white;
            border: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background 0.2s;
          }

          .remove-photo-btn:hover {
            background: #e53935;
          }

          .add-more-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            background-color: var(--color-surface-container-low);
            border: 2px dashed var(--color-outline-variant);
            color: var(--color-sea);
            font-size: 11px;
            font-weight: 700;
            font-family: var(--font-display);
            cursor: pointer;
          }

          .add-more-card:hover {
            border-color: var(--color-sea);
            background-color: var(--color-surface-container);
          }

          /* Form Elements */
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

          .field-label {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            font-weight: 700;
            font-family: var(--font-display);
            color: var(--color-text-main);
          }

          .select-container select.pill-input {
            width: 100%;
            padding: 10px 16px;
            font-size: 14px;
            border-radius: 9999px;
            border: 1px solid var(--color-outline-variant);
            background-color: var(--color-surface-container-low);
            color: var(--color-text-main);
            cursor: pointer;
          }

          .datetime-row {
            display: flex;
            gap: 16px;
          }

          .location-picker-trigger {
            display: flex;
            align-items: center;
            gap: 12px;
            background-color: var(--color-surface-container-low);
            border-radius: 9999px;
            padding: 12px 20px;
            cursor: pointer;
            border: 1px solid var(--color-outline-variant);
            color: var(--color-text-main);
            transition: background-color 0.2s, border-color 0.2s;
          }

          .location-picker-trigger:hover {
            background-color: var(--color-surface-container-high);
            border-color: var(--color-outline);
          }

          .loc-pin {
            color: var(--color-sea);
            flex-shrink: 0;
          }

          .loc-text-col {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .loc-main {
            font-size: 14px;
            font-weight: 600;
          }

          .loc-coords {
            font-size: 11px;
            color: var(--color-text-muted);
          }

          .label-row-with-action {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .action-text {
            font-size: 12px;
            color: var(--color-sea);
            font-weight: 700;
            cursor: pointer;
          }

          .members-loading {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            color: var(--color-text-muted);
            padding: 8px 0;
          }

          .no-members-hint {
            font-size: 13px;
            color: var(--color-text-muted);
            margin: 0;
            padding: 6px 0;
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
            gap: 6px;
            cursor: pointer;
            width: 68px;
          }

          .avatar-wrapper {
            position: relative;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background-color: var(--color-surface-container);
            border: 2px solid transparent;
            transition: border-color 0.2s, transform 0.2s;
          }

          .participant-chip:hover .avatar-wrapper {
            transform: scale(1.05);
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
            font-size: 12px;
            color: var(--color-text-muted);
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 68px;
            text-align: center;
          }

          .sticky-cta-footer {
            margin-top: 12px;
            padding-bottom: 32px;
          }

          :global(.spin-icon) {
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          /* Location Modal Styles */
          .location-modal-body {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .search-input-row input {
            width: 100%;
            padding: 10px 16px;
            font-size: 14px;
            border-radius: 9999px;
            border: 1px solid var(--color-outline-variant);
            background-color: var(--color-surface-container-low);
          }

          .gps-action-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 10px 16px;
            border-radius: 14px;
            background-color: var(--tint-sea);
            color: var(--color-sea);
            border: 1px solid var(--color-sea);
            font-size: 13px;
            font-weight: 700;
            font-family: var(--font-display);
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .gps-action-btn:hover {
            background-color: var(--color-sea);
            color: white;
          }

          .section-title {
            font-size: 12px;
            font-weight: 700;
            color: var(--color-text-muted);
            font-family: var(--font-display);
            margin-top: 4px;
          }

          .suggested-results {
            display: flex;
            flex-direction: column;
            gap: 8px;
            max-height: 220px;
            overflow-y: auto;
            scrollbar-width: thin;
          }

          .spot-result-row {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 10px 12px;
            border-radius: 12px;
            cursor: pointer;
            border: 1px solid transparent;
            transition: background-color 0.2s, border-color 0.2s;
          }

          .spot-result-row:hover {
            background-color: var(--color-surface-container-low);
            border-color: var(--color-outline-variant);
          }

          :global(.spot-pin-icon) {
            color: var(--color-tangerine);
            margin-top: 2px;
            flex-shrink: 0;
          }

          .spot-details {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .spot-name {
            font-weight: 700;
            font-size: 13px;
            color: var(--color-text-main);
          }

          .spot-desc {
            font-size: 11px;
            color: var(--color-text-muted);
          }

          .spot-coords-tag {
            font-size: 10px;
            font-family: monospace;
            color: var(--color-outline);
          }

          .custom-coords-toggle {
            display: flex;
            flex-direction: column;
            gap: 10px;
            border-top: 1px solid var(--color-surface-container-high);
            padding-top: 12px;
          }

          .toggle-link {
            background: none;
            border: none;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            color: var(--color-blush);
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
          }

          .custom-coords-box {
            display: flex;
            flex-direction: column;
            gap: 10px;
            background-color: var(--color-surface-container-low);
            padding: 12px;
            border-radius: 14px;
          }

          .coords-inputs-row {
            display: flex;
            gap: 12px;
          }

          .coord-field {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .coord-field label {
            font-size: 11px;
            font-weight: 700;
            color: var(--color-text-muted);
          }

          .coord-field input {
            width: 100%;
            padding: 6px 12px;
            font-size: 12px;
            border-radius: 9999px;
            border: 1px solid var(--color-outline-variant);
            background-color: var(--color-surface-container-lowest);
          }

          .attendee-actions-row {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .add-user-action {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            color: var(--color-sea);
          }

          .empty-attendees-card {
            background-color: var(--color-surface-container-low);
            border-radius: 16px;
            padding: 14px 16px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            align-items: flex-start;
          }

          .add-by-username-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: none;
            border: 1px dashed var(--color-sea);
            color: var(--color-sea);
            font-size: 12px;
            font-weight: 700;
            font-family: var(--font-display);
            padding: 6px 12px;
            border-radius: 9999px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .add-by-username-btn:hover {
            background-color: var(--tint-sea);
          }

          .add-more-chip {
            opacity: 0.85;
          }

          .add-avatar {
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: var(--color-surface-container-lowest);
            border: 2px dashed var(--color-sea);
            color: var(--color-sea);
          }

          .add-more-chip:hover .add-avatar {
            background-color: var(--tint-sea);
            border-color: var(--color-sea);
          }

          /* User Search Modal */
          .user-search-modal-body {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .search-modal-subtitle {
            font-size: 13px;
            color: var(--color-text-muted);
            margin: 0;
          }

          .search-input-form-row {
            display: flex;
            gap: 10px;
            align-items: center;
          }

          .search-user-input {
            flex: 1;
            padding: 10px 16px;
            font-size: 14px;
            border-radius: 9999px;
            border: 1px solid var(--color-outline-variant);
            background-color: var(--color-surface-container-low);
          }

          .search-user-error-alert {
            background-color: rgba(229, 57, 53, 0.1);
            color: #d32f2f;
            border: 1px solid rgba(229, 57, 53, 0.3);
            border-radius: 12px;
            padding: 10px 14px;
            font-size: 13px;
            font-weight: 600;
          }

          .exact-match-result-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background-color: var(--color-surface-container-lowest);
            border: 1px solid var(--color-outline-variant);
            border-radius: 16px;
            padding: 12px 16px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          }

          .match-profile-info {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .match-avatar-img {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid var(--color-surface-container-high);
          }

          .match-text-col {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .match-username-text {
            font-size: 15px;
            font-weight: 800;
            font-family: var(--font-display);
            color: var(--color-text-main);
          }

          .modal-footer-btns {
            margin-top: 8px;
          }
        `}</style>
      </Layout>
    </ProtectedRoute>
  )
}
