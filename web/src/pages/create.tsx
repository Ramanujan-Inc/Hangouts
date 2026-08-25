import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { MapPin, Users, Sparkles, Loader2 } from 'lucide-react'
import { Button, TextArea, TextField, InlineAlert } from '../components/ui'
import {
  GroupMemberProfile,
  Group,
  HangoutResponse,
  UploadedPhoto,
  PhotoUploaderSection,
  ParticipantSelector,
  DateTimeInput,
  LocationSection,
  AddAttendeeModal,
} from '../components/create'

export default function CreateHangout() {
  const router = useRouter()
  const { user } = useAuth()

  // Form Fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [showTimeInput, setShowTimeInput] = useState(false)
  const [locationName, setLocationName] = useState('')
  const [formattedAddress, setFormattedAddress] = useState('')
  const [placeId, setPlaceId] = useState('')
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

  // Modals
  const [showAddAttendeeModal, setShowAddAttendeeModal] = useState(false)

  // Photos
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([])
  const [selectedCoverIndex, setSelectedCoverIndex] = useState<number>(-1)

  // Status
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Fetch user groups and all known group circle members on mount in a single request
  useEffect(() => {
    async function loadGroupsAndMembers() {
      try {
        setLoadingMembers(true)
        const data = await api.get<Group[]>('/groups')
        setGroups(data || [])

        const knownMembersMap = new Map<string, GroupMemberProfile>()
        for (const grp of data || []) {
          if (grp.members) {
            for (const m of grp.members) {
              if (m.status === 'accepted' && m.profile && m.profile.id !== user?.id) {
                knownMembersMap.set(m.profile.id, m.profile)
              }
            }
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

  // When group selection changes, read from cached groups or fetch on demand
  useEffect(() => {
    async function loadGroupMembers() {
      if (!selectedGroupId) {
        setGroupMembers([])
        return
      }

      // Check if group and members are already in memory
      const cachedGroup = groups.find((g) => g.id === selectedGroupId)
      if (cachedGroup && cachedGroup.members) {
        const membersList = cachedGroup.members
          .filter((m) => m.status === 'accepted' && m.profile && m.profile.id !== user?.id)
          .map((m) => m.profile as GroupMemberProfile)
        setGroupMembers(membersList)
        setSelectedParticipants(membersList.map((m) => m.id))
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
  }, [selectedGroupId, groups, user?.id])

  // Photo handlers
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
    e.target.value = ''
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

  const handleCaptionChange = (index: number, caption: string) => {
    setUploadedPhotos((prev) =>
      prev.map((photo, idx) => (idx === index ? { ...photo, caption } : photo))
    )
  }

  // Attendees handlers
  const activeMembersList = selectedGroupId
    ? groupMembers
    : [
        ...allCircleMembers,
        ...customAttendees.filter((custom) => !allCircleMembers.some((m) => m.id === custom.id)),
      ]

  const handleToggleParticipant = (memberId: string) => {
    if (selectedParticipants.includes(memberId)) {
      setSelectedParticipants(selectedParticipants.filter((id) => id !== memberId))
    } else {
      setSelectedParticipants([...selectedParticipants, memberId])
    }
  }

  const handleSelectAllParticipants = () => {
    if (selectedParticipants.length === activeMembersList.length) {
      setSelectedParticipants([])
    } else {
      setSelectedParticipants(activeMembersList.map((m) => m.id))
    }
  }

  const handleAddFoundUser = (profile: GroupMemberProfile) => {
    if (!customAttendees.some((m) => m.id === profile.id)) {
      setCustomAttendees((prev) => [...prev, profile])
    }
    if (!selectedParticipants.includes(profile.id)) {
      setSelectedParticipants((prev) => [...prev, profile.id])
    }
  }

  // Location handler
  const handleLocationChange = (data: {
    locationName: string
    formattedAddress?: string
    latitude?: number
    longitude?: number
    placeId?: string
  }) => {
    setLocationName(data.locationName)
    if (data.formattedAddress !== undefined) setFormattedAddress(data.formattedAddress)
    if (data.latitude !== undefined) setLatitude(data.latitude)
    if (data.longitude !== undefined) setLongitude(data.longitude)
    if (data.placeId !== undefined) setPlaceId(data.placeId)
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
        formatted_address: formattedAddress.trim() || undefined,
        place_id: placeId.trim() || undefined,
        latitude: latitude !== null ? latitude : undefined,
        longitude: longitude !== null ? longitude : undefined,
        cover_photo_url: coverPhotoUrl,
        group_id: selectedGroupId || undefined,
      }

      const createdHangout = await api.post<HangoutResponse>('/hangouts', hangoutPayload)
      const hangoutId = createdHangout.id

      // 3. Upload attached photos into hangout media album
      if (uploadedPhotos.length > 0) {
        try {
          const mediaForm = new FormData()
          uploadedPhotos.forEach((photo) => mediaForm.append('files', photo.file))
          const captionsList = uploadedPhotos.map((p) => p.caption || '')
          mediaForm.append('captions_json', JSON.stringify(captionsList))
          mediaForm.append('is_shared', 'true')
          await api.post(`/hangouts/${hangoutId}/media/bulk`, mediaForm)
        } catch (uploadErr) {
          console.warn('Failed to bulk upload media items:', uploadErr)
        }
      }

      // 4. Add selected participants
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

  return (
    <ProtectedRoute>
      <Layout>
        <Head>
          <title>New Hangout | Hangout</title>
        </Head>

        <div className="create-hangout-page">
          <header className="page-header">
            <h2 className="page-heading">Create a Hangout</h2>
            <p className="page-subheading">
              Capture memories, add pictures, and organize your scrapbook.
            </p>
          </header>

          {errorMessage && <InlineAlert>{errorMessage}</InlineAlert>}

          <form onSubmit={handleCreateHangout} className="create-form">
            {/* Cover & Multi-Picture Upload Section */}
            <PhotoUploaderSection
              uploadedPhotos={uploadedPhotos}
              selectedCoverIndex={selectedCoverIndex}
              onPhotoSelect={handlePhotoSelect}
              onSelectCover={(idx) => setSelectedCoverIndex(idx)}
              onRemovePhoto={handleRemovePhoto}
              onCaptionChange={handleCaptionChange}
            />

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

              {/* Dynamic Attendees Participant Selector */}
              <ParticipantSelector
                activeMembersList={activeMembersList}
                selectedParticipants={selectedParticipants}
                selectedGroupId={selectedGroupId}
                loadingMembers={loadingMembers}
                onToggleParticipant={handleToggleParticipant}
                onSelectAll={handleSelectAllParticipants}
                onOpenAddAttendeeModal={() => setShowAddAttendeeModal(true)}
              />

              {/* Date & Optional Time Row */}
              <DateTimeInput
                date={date}
                time={time}
                showTimeInput={showTimeInput}
                onDateChange={setDate}
                onTimeChange={setTime}
                onToggleTimeInput={setShowTimeInput}
              />

              {/* Inline Interactive Location Section */}
              <LocationSection
                locationName={locationName}
                formattedAddress={formattedAddress}
                latitude={latitude}
                longitude={longitude}
                placeId={placeId}
                onLocationChange={handleLocationChange}
              />
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

          {/* Add Attendee by Username Modal */}
          <AddAttendeeModal
            isOpen={showAddAttendeeModal}
            onClose={() => setShowAddAttendeeModal(false)}
            onAddUser={handleAddFoundUser}
            currentUserId={user?.id}
          />
        </div>

        <style jsx>{`
          .create-hangout-page {
            max-width: 600px;
            margin: 0 auto;
            padding-bottom: 80px;
          }

          .page-header {
            margin-bottom: 24px;
          }

          .page-heading {
            font-size: 28px;
            color: var(--color-text);
            margin: 0;
          }

          .page-subheading {
            font-size: 14px;
            color: var(--color-text-muted);
            margin-top: 4px;
            margin-bottom: 0;
          }

          .create-form {
            display: flex;
            flex-direction: column;
            gap: 24px;
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

          .field-label {
            font-family: var(--font-display);
            font-weight: 700;
            font-size: 14px;
            color: var(--color-text);
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .select-container {
            position: relative;
          }

          .select-input {
            appearance: none;
            cursor: pointer;
            padding-right: 36px;
          }

          .sticky-cta-footer {
            margin-top: 12px;
          }

          :global(.spin-icon) {
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </Layout>
    </ProtectedRoute>
  )
}
