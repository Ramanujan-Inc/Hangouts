import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { Sparkles, Loader2, Users } from 'lucide-react'
import { Button, InlineAlert, Select } from '../components/ui'
import {
  GroupMemberProfile,
  Group,
  HangoutResponse,
  UploadedPhoto,
  PhotoUploaderSection,
  TitleDescriptionInput,
  ParticipantSelector,
  DateTimeInput,
  LocationSection,
} from '../components/create'
import { extractBatchPhotoMetadata } from '../lib/exif'
import { resolveBatchLocation } from '../lib/geocoding'
import { generateVideoThumbnail } from '../lib/video'
import { getHangoutUrl } from '../lib/hangoutUrl'

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
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  // Photos
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([])
  const [selectedCoverIndex, setSelectedCoverIndex] = useState<number>(-1)
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0)

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
        setSelectedParticipants([])
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

  // Media handlers (photos and videos)
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const rawFiles: File[] = []
    const newMediaItems: UploadedPhoto[] = []
    const videoThumbPromises: Promise<void>[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      rawFiles.push(file)
      const previewUrl = URL.createObjectURL(file)
      const isVideo = file.type.startsWith('video/')

      const mediaItem: UploadedPhoto = {
        id: `${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl,
        isVideo,
      }

      if (isVideo) {
        // Asynchronously extract video thumbnail at 0.5s via Canvas
        videoThumbPromises.push(
          generateVideoThumbnail(file, 0.5)
            .then((thumb) => {
              mediaItem.thumbnailBlob = thumb.blob
              mediaItem.thumbnailUrl = thumb.url
            })
            .catch((thumbErr) => {
              console.warn('Video thumbnail extraction failed:', thumbErr)
            })
        )
      }

      newMediaItems.push(mediaItem)
    }

    // Set media items in state
    setUploadedPhotos((prev) => {
      const updated = [...prev, ...newMediaItems]
      if (selectedCoverIndex === -1 && updated.length > 0) {
        setSelectedCoverIndex(0)
      }
      return updated
    })

    // When video thumbnails resolve, update state so thumbnails show up
    if (videoThumbPromises.length > 0) {
      Promise.all(videoThumbPromises).then(() => {
        setUploadedPhotos((prev) => [...prev])
      })
    }

    // Extract EXIF metadata for images only to auto-prefill Date & Location if empty
    const imageFiles = rawFiles.filter((f) => f.type.startsWith('image/'))
    if (imageFiles.length > 0) {
      extractBatchPhotoMetadata(imageFiles).then(async (meta) => {
        // 1. Auto-prefill Date only if date is blank
        if (meta.date) {
          setDate((currentDate) => (currentDate ? currentDate : meta.date!))
        }

        // 2. Auto-prefill Location via clustering + majority vote if location is blank
        if (meta.gpsPoints.length > 0 && !locationName && latitude === null) {
          try {
            const geo = await resolveBatchLocation(meta.gpsPoints)
            if (geo) {
              setLocationName((current) => current || geo.locationName)
              setFormattedAddress((current) => current || geo.formattedAddress)
              setLatitude((current) => (current !== null ? current : geo.latitude))
              setLongitude((current) => (current !== null ? current : geo.longitude))
              if (geo.placeId) {
                setPlaceId((current) => current || geo.placeId!)
              }
            }
          } catch (err) {
            console.warn('Auto cluster reverse-geocode error:', err)
          }
        }
      }).catch((err) => {
        console.warn('Metadata extraction failed:', err)
      })
    }

    e.target.value = ''
  }

  const handleRemovePhoto = (indexToRemove: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setUploadedPhotos((prev) => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove)
      if (updated.length === 0) {
        setSelectedCoverIndex(-1)
        setActivePhotoIndex(0)
      } else {
        if (selectedCoverIndex === indexToRemove) {
          setSelectedCoverIndex(0)
        } else if (selectedCoverIndex > indexToRemove) {
          setSelectedCoverIndex((curr) => curr - 1)
        }

        setActivePhotoIndex((curr) => {
          if (curr >= updated.length) {
            return updated.length - 1
          } else if (curr > indexToRemove) {
            return curr - 1
          }
          return curr
        })
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
  const activeMembersList = selectedGroupId ? groupMembers : allCircleMembers

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
        const coverMedia = uploadedPhotos[selectedCoverIndex]
        const coverForm = new FormData()
        if (coverMedia.isVideo && coverMedia.thumbnailBlob) {
          coverForm.append('file', coverMedia.thumbnailBlob, 'cover-thumbnail.jpg')
        } else {
          coverForm.append('file', coverMedia.file)
        }
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

      router.push(getHangoutUrl(createdHangout))
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
              activePhotoIndex={activePhotoIndex}
              onPhotoSelect={handlePhotoSelect}
              onSelectCover={(idx) => setSelectedCoverIndex(idx)}
              onSelectActivePhoto={(idx) => setActivePhotoIndex(idx)}
              onRemovePhoto={handleRemovePhoto}
              onCaptionChange={handleCaptionChange}
            />

            {/* Form Fields */}
            <div className="form-fields">
              {/* Title & Optional Collapsible Description */}
              <TitleDescriptionInput
                title={title}
                description={description}
                onTitleChange={setTitle}
                onDescriptionChange={setDescription}
              />

              {/* Group Selection Dropdown */}
              <Select
                label="Group Circle"
                icon={<Users size={16} />}
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
              >
                <option value="">No group</option>
                {groups.map((grp) => (
                  <option key={grp.id} value={grp.id}>
                    {grp.name}
                  </option>
                ))}
              </Select>

              {/* Dynamic Attendees Participant Selector */}
              <ParticipantSelector
                activeMembersList={activeMembersList}
                selectedParticipants={selectedParticipants}
                selectedGroupId={selectedGroupId}
                loadingMembers={loadingMembers}
                onToggleParticipant={handleToggleParticipant}
                onSelectAll={handleSelectAllParticipants}
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
