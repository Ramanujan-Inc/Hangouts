import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { useAuth } from '../context/AuthContext'
import { api, ApiError } from '../lib/api'
import { formatBytes } from '../lib/format'
import {
  Camera,
  Sparkles,
  Settings,
  Bell,
  LogOut,
  ChevronRight,
  Check,
  HardDrive,
  AlertCircle,
  Loader2,
  Upload,
  Pencil,
} from 'lucide-react'
import { profileAvatars } from '../data/mock'
import { Button, Modal } from '../components/ui'

interface StorageUsage {
  used_bytes: number
  max_bytes: number
  percentage_used: number
}

export default function ProfileSettings() {
  const router = useRouter()
  const { user, logout, refreshUser } = useAuth()
  const [avatarIndex, setAvatarIndex] = useState(0)
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [tempName, setTempName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [isSavingName, setIsSavingName] = useState(false)
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false)
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null)
  const [loadingStorage, setLoadingStorage] = useState(true)
  const [toastMessage, setToastMessage] = useState('')

  const displayName = user?.username || 'User'
  const displayEmail = user?.email || ''
  const currentAvatar = user?.avatar_url || profileAvatars[avatarIndex] || profileAvatars[0]

  useEffect(() => {
    if (user?.username) {
      setTempName(user.username)
    }
    if (user?.avatar_url) {
      const idx = profileAvatars.indexOf(user.avatar_url)
      if (idx !== -1) {
        setAvatarIndex(idx)
      }
    }
  }, [user])

  const fetchStorageUsage = async () => {
    try {
      setLoadingStorage(true)
      const usage = await api.get<StorageUsage>('/storage/usage')
      setStorageUsage(usage)
    } catch (err) {
      console.error('Failed to load storage usage:', err)
      setStorageUsage({
        used_bytes: 0,
        max_bytes: 500 * 1024 * 1024,
        percentage_used: 0.0,
      })
    } finally {
      setLoadingStorage(false)
    }
  }

  useEffect(() => {
    refreshUser().catch(console.error)
    fetchStorageUsage()
  }, [])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file.')
      return
    }

    try {
      setIsUpdatingAvatar(true)
      const formData = new FormData()
      formData.append('file', file)
      await api.upload<{ url: string }>('/profiles/avatar', formData)
      await refreshUser()
      setIsAvatarModalOpen(false)
      showToast('Profile picture uploaded!')
    } catch (err: any) {
      console.error('Failed to upload avatar:', err)
      showToast(err?.message || 'Failed to upload photo')
    } finally {
      setIsUpdatingAvatar(false)
      e.target.value = ''
    }
  }

  const handleSelectPreset = async (presetUrl: string) => {
    if (isUpdatingAvatar) return
    const idx = profileAvatars.indexOf(presetUrl)
    if (idx !== -1) setAvatarIndex(idx)

    try {
      setIsUpdatingAvatar(true)
      await api.patch('/profiles/me', { avatar_url: presetUrl })
      await refreshUser()
      setIsAvatarModalOpen(false)
      showToast('Avatar updated!')
    } catch (err: any) {
      console.error('Failed to update avatar:', err)
      showToast(err?.message || 'Failed to update avatar')
    } finally {
      setIsUpdatingAvatar(false)
    }
  }

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = tempName.trim()
    if (!trimmed) return
    if (trimmed === user?.username) {
      setIsEditingName(false)
      return
    }

    setNameError(null)
    try {
      setIsSavingName(true)
      await api.patch('/profiles/me', { username: trimmed })
      await refreshUser()
      setIsEditingName(false)
      showToast('Profile name updated!')
    } catch (err: any) {
      console.error('Failed to update username:', err)
      if (err instanceof ApiError) {
        setNameError(err.message)
      } else {
        setNameError(err?.message || 'Failed to update username')
      }
    } finally {
      setIsSavingName(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <ProtectedRoute>
      <Layout>
        <Head>
          <title>My Profile | Hangout</title>
        </Head>

        <div className="profile-page-container">
          {toastMessage && (
            <div className="toast-notification">
              <Check size={16} />
              <span>{toastMessage}</span>
            </div>
          )}

          <h2 className="page-heading">Settings</h2>

          {/* Profile Card Header */}
          <div className="profile-header-card">
            {/* Sparkle Decorative Flourishes */}
            <Sparkles className="sparkle-flourish pos-left" size={20} />
            <Sparkles className="sparkle-flourish pos-right" size={24} />

            <div
              className={`avatar-edit-wrapper ${isUpdatingAvatar ? 'updating' : ''}`}
              onClick={() => setIsAvatarModalOpen(true)}
              title="Click to change profile picture"
            >
              <img src={currentAvatar} alt="Profile Avatar" className="profile-avatar-img" />
              <div className="camera-badge">
                {isUpdatingAvatar ? <Loader2 size={14} className="spin-icon" /> : <Camera size={14} />}
              </div>
            </div>

            {isEditingName ? (
              <form onSubmit={handleSaveName} className="name-edit-form">
                {nameError && (
                  <div className="error-box">
                    <AlertCircle size={14} />
                    <span>{nameError}</span>
                  </div>
                )}
                <input
                  type="text"
                  className="pill-input compact"
                  value={tempName}
                  onChange={(e) => {
                    setTempName(e.target.value)
                    if (nameError) setNameError(null)
                  }}
                  autoFocus
                  required
                  disabled={isSavingName}
                />
                <div className="edit-btn-row">
                  <Button size="small" type="submit" disabled={isSavingName || !tempName.trim()}>
                    {isSavingName ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    variant="outline"
                    size="small"
                    type="button"
                    disabled={isSavingName}
                    onClick={() => {
                      setNameError(null)
                      setTempName(user?.username || '')
                      setIsEditingName(false)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="profile-name-block">
                <div className="username-row">
                  <h3>{displayName}</h3>
                  <button
                    className="edit-name-icon-btn"
                    onClick={() => {
                      setNameError(null)
                      setTempName(displayName)
                      setIsEditingName(true)
                    }}
                    title="Edit username"
                    aria-label="Edit username"
                  >
                    <Pencil size={15} />
                  </button>
                </div>
                <p>{displayEmail}</p>
              </div>
            )}
          </div>

          {/* Storage Usage Section */}
          <div className="storage-card">
            <div className="storage-card-header">
              <div className="storage-header-left">
                <div className="storage-icon-box">
                  <HardDrive size={18} />
                </div>
                <div className="storage-text-block">
                  <div className="storage-title">Storage Usage</div>
                  <div className="storage-subtitle">
                    {loadingStorage ? (
                      'Loading quota...'
                    ) : (
                      <>
                        <strong>{formatBytes(storageUsage?.used_bytes ?? 0)}</strong> of{' '}
                        {formatBytes(storageUsage?.max_bytes ?? 500 * 1024 * 1024)} used
                      </>
                    )}
                  </div>
                </div>
              </div>
              {!loadingStorage && (
                <span className="storage-pill">
                  {storageUsage ? `${storageUsage.percentage_used}%` : '0%'}
                </span>
              )}
            </div>

            <div className="storage-meter-track">
              <div
                className="storage-meter-fill"
                style={{
                  width: `${Math.min(Math.max(storageUsage?.percentage_used ?? 0, 0), 100)}%`,
                  backgroundColor:
                    (storageUsage?.percentage_used ?? 0) > 90
                      ? 'var(--color-blush)'
                      : (storageUsage?.percentage_used ?? 0) > 75
                      ? 'var(--color-tangerine)'
                      : 'var(--color-matcha)',
                }}
              />
            </div>

            <div className="storage-card-footer">
              <p>Uploaded photos and videos in your hangouts count towards your 500 MB quota.</p>
            </div>
          </div>

          {/* Settings Rows */}
          <div className="settings-list-card">
            <div className="settings-row">
              <div className="settings-row-left">
                <div className="settings-icon-box note-blush">
                  <Bell size={18} />
                </div>
                <div className="settings-text-box">
                  <div className="settings-title">Notification Preferences</div>
                  <div className="settings-desc">Mute chats and emails</div>
                </div>
              </div>
              <span className="coming-soon-pill">Coming Soon</span>
            </div>

            <div className="settings-divider" />

            <div className="settings-row">
              <div className="settings-row-left">
                <div className="settings-icon-box note-sea">
                  <Settings size={18} />
                </div>
                <div className="settings-text-box">
                  <div className="settings-title">App Theme</div>
                  <div className="settings-desc">Nostalgic Scrapbook (Default)</div>
                </div>
              </div>
              <ChevronRight size={18} className="chevron-icon" />
            </div>
          </div>

          {/* Log Out Row */}
          <button className="logout-btn-row" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Log Out</span>
          </button>

          {/* Legal & Map Attributions */}
          <div className="attributions-footer">
            <p>
              Map data &copy;{' '}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
              >
                OpenStreetMap
              </a>{' '}
              contributors, &copy;{' '}
              <a
                href="https://carto.com/attributions"
                target="_blank"
                rel="noopener noreferrer"
              >
                CARTO
              </a>
            </p>
          </div>

          {/* Avatar Selection Modal */}
          {isAvatarModalOpen && (
            <Modal title="Choose Profile Picture" onClose={() => setIsAvatarModalOpen(false)}>
              <div className="avatar-modal-body">
                <label className="upload-avatar-box">
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleAvatarFileUpload}
                    disabled={isUpdatingAvatar}
                  />
                  <div className="upload-avatar-inner">
                    {isUpdatingAvatar ? (
                      <Loader2 size={24} className="spin-icon" />
                    ) : (
                      <Upload size={24} className="upload-icon" />
                    )}
                    <span className="upload-text">
                      {isUpdatingAvatar ? 'Uploading photo...' : 'Upload photo from device'}
                    </span>
                  </div>
                </label>

                <div className="avatar-modal-divider">
                  <span>or choose a preset avatar</span>
                </div>

                <div className="preset-avatars-grid">
                  {profileAvatars.map((avatarUrl, idx) => {
                    const isSelected = currentAvatar === avatarUrl
                    return (
                      <div
                        key={idx}
                        className={`preset-avatar-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectPreset(avatarUrl)}
                        title={`Select preset ${idx + 1}`}
                      >
                        <img src={avatarUrl} alt={`Preset avatar ${idx + 1}`} className="preset-img" />
                        {isSelected && (
                          <div className="preset-check-badge">
                            <Check size={12} color="white" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="avatar-modal-actions">
                  <Button variant="outline" size="small" onClick={() => setIsAvatarModalOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Modal>
          )}
        </div>

        <style jsx>{`
          .profile-page-container {
            max-width: 600px;
            margin: 0 auto;
            position: relative;
          }

          .toast-notification {
            position: fixed;
            top: 24px;
            left: 50%;
            transform: translateX(-50%);
            background-color: var(--color-matcha);
            color: white;
            padding: 12px 24px;
            border-radius: 9999px;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
            font-weight: 700;
            font-size: 14px;
            z-index: 5000;
            animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }

          /* Profile Header Card */
          .profile-header-card {
            background-color: var(--color-surface-container-lowest);
            border-radius: 28px;
            padding: 32px 24px;
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
            box-shadow: var(--shadow-ambient);
            border: 1px solid var(--color-surface-container-high);
            margin-bottom: 24px;
            overflow: hidden;
          }

          .sparkle-flourish {
            position: absolute;
            color: var(--color-tangerine);
            opacity: 0.7;
          }

          .sparkle-flourish.pos-left {
            top: 24px;
            left: 24px;
            animation: spinSlow 8s linear infinite;
          }

          .sparkle-flourish.pos-right {
            bottom: 24px;
            right: 24px;
            animation: float 4s ease-in-out infinite;
          }

          .avatar-edit-wrapper {
            position: relative;
            width: 96px;
            height: 96px;
            border-radius: 50%;
            background-color: var(--color-surface-container);
            border: 3px solid var(--color-outline-variant);
            cursor: pointer;
            margin-bottom: 16px;
            transition: transform 0.2s;
          }

          .avatar-edit-wrapper:hover {
            transform: scale(1.04);
          }

          .avatar-edit-wrapper.updating {
            opacity: 0.7;
            pointer-events: none;
          }

          .profile-avatar-img {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
          }

          .camera-badge {
            position: absolute;
            bottom: 0;
            right: 0;
            background-color: var(--color-blush);
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
          }

          .spin-icon {
            animation: spin 1s linear infinite;
          }

          .profile-name-block {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .username-row {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }

          .username-row h3 {
            font-size: 24px;
            font-family: var(--font-display);
          }

          .edit-name-icon-btn {
            background: none;
            border: none;
            color: var(--color-outline);
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 6px;
            border-radius: 50%;
            transition: all 0.2s ease;
          }

          .edit-name-icon-btn:hover {
            color: var(--color-blush);
            background-color: var(--tint-blush);
            transform: scale(1.1);
          }

          .profile-name-block p {
            font-size: 14px;
            color: var(--color-text-muted);
            margin-top: 2px;
            margin-bottom: 8px;
          }

          .name-edit-form {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            width: 100%;
            max-width: 280px;
          }

          .error-box {
            display: flex;
            align-items: center;
            gap: 6px;
            background-color: var(--tint-blush);
            color: var(--color-blush);
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            width: 100%;
          }

          .edit-btn-row {
            display: flex;
            gap: 8px;
          }

          /* Storage Usage Card */
          .storage-card {
            background-color: var(--color-surface-container-lowest);
            border-radius: 24px;
            padding: 20px 24px;
            box-shadow: var(--shadow-ambient);
            border: 1px solid var(--color-surface-container-high);
            margin-bottom: 24px;
          }

          .storage-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .storage-header-left {
            display: flex;
            align-items: center;
            gap: 16px;
          }

          .storage-icon-box {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: var(--tint-butter);
            color: var(--color-tangerine);
          }

          .storage-text-block {
            display: flex;
            flex-direction: column;
          }

          .storage-title {
            font-weight: 700;
            font-size: 15px;
            color: var(--color-text);
          }

          .storage-subtitle {
            font-size: 13px;
            color: var(--color-text-muted);
            margin-top: 2px;
          }

          .storage-subtitle strong {
            color: var(--color-text);
          }

          .storage-pill {
            background-color: var(--tint-butter);
            color: var(--color-tangerine);
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 700;
          }

          .storage-meter-track {
            width: 100%;
            height: 10px;
            background-color: var(--color-surface-container);
            border-radius: 9999px;
            overflow: hidden;
            margin-top: 16px;
            margin-bottom: 12px;
          }

          .storage-meter-fill {
            height: 100%;
            border-radius: 9999px;
            transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s ease;
          }

          .storage-card-footer p {
            font-size: 12px;
            color: var(--color-text-muted);
            line-height: 1.4;
          }

          /* Settings list */
          .settings-list-card {
            background-color: var(--color-surface-container-lowest);
            border-radius: 24px;
            padding: 8px 20px;
            box-shadow: var(--shadow-ambient);
            border: 1px solid var(--color-surface-container-high);
            margin-bottom: 32px;
          }

          .settings-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 0;
          }

          .settings-row.clickable {
            cursor: pointer;
            transition: transform 0.15s ease;
          }

          .settings-row.clickable:hover {
            transform: translateX(3px);
          }

          .settings-row-left {
            display: flex;
            align-items: center;
            gap: 16px;
          }

          .settings-icon-box {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--color-text);
          }

          .settings-icon-box.note-butter {
            background-color: var(--tint-butter);
            color: var(--color-tangerine);
          }
          .settings-icon-box.note-blush {
            background-color: var(--tint-blush);
            color: var(--color-blush);
          }
          .settings-icon-box.note-sea {
            background-color: var(--tint-sea);
            color: var(--color-sea);
          }

          .settings-title {
            font-weight: 700;
            font-size: 15px;
            color: var(--color-text);
          }

          .settings-desc {
            font-size: 12px;
            color: var(--color-text-muted);
            margin-top: 1px;
          }

          .chevron-icon {
            color: var(--color-outline);
          }

          .coming-soon-pill {
            background-color: var(--color-surface-container-high);
            color: var(--color-text-muted);
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
          }

          .settings-divider {
            height: 1px;
            background-color: var(--color-surface-container);
          }

          /* Logout button */
          .logout-btn-row {
            width: 100%;
            background-color: transparent;
            border: 2px solid #ffb1c1;
            color: var(--color-blush);
            padding: 14px;
            border-radius: 9999px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            cursor: pointer;
            font-family: var(--font-display);
            font-weight: 700;
            font-size: 16px;
            transition: background 0.2s;
          }

          .logout-btn-row:hover {
            background-color: var(--tint-blush);
          }

          .attributions-footer {
            margin-top: 36px;
            margin-bottom: 12px;
            text-align: center;
            font-size: 12px;
            color: var(--color-text-muted);
          }

          .attributions-footer a {
            color: var(--color-sea);
            text-decoration: underline;
          }

          .attributions-footer a:hover {
            color: var(--color-blush);
          }

          /* Avatar Modal */
          .avatar-modal-body {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .upload-avatar-box {
            display: block;
            width: 100%;
            padding: 20px 16px;
            background-color: var(--color-surface-container-low);
            border: 2px dashed var(--color-outline-variant);
            border-radius: 18px;
            cursor: pointer;
            text-align: center;
            transition: all 0.2s ease;
          }

          .upload-avatar-box:hover {
            background-color: var(--color-surface-container);
            border-color: var(--color-blush);
          }

          .upload-avatar-inner {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            color: var(--color-text);
          }

          .upload-icon {
            color: var(--color-tangerine);
          }

          .upload-text {
            font-size: 14px;
            font-weight: 700;
            font-family: var(--font-display);
          }

          .avatar-modal-divider {
            text-align: center;
            position: relative;
            margin: 4px 0;
          }

          .avatar-modal-divider::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            height: 1px;
            background-color: var(--color-surface-container-high);
            z-index: 1;
          }

          .avatar-modal-divider span {
            position: relative;
            background-color: var(--color-surface-container-lowest);
            padding: 0 12px;
            font-size: 12px;
            color: var(--color-text-muted);
            z-index: 2;
          }

          .preset-avatars-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 14px;
            margin-bottom: 4px;
          }

          .preset-avatar-item {
            position: relative;
            aspect-ratio: 1;
            border-radius: 50%;
            background-color: var(--color-surface-container);
            border: 3px solid transparent;
            cursor: pointer;
            transition: transform 0.2s ease, border-color 0.2s ease;
            overflow: visible;
          }

          .preset-avatar-item:hover {
            transform: scale(1.08);
          }

          .preset-avatar-item.selected {
            border-color: var(--color-blush);
          }

          .preset-img {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
          }

          .preset-check-badge {
            position: absolute;
            bottom: -2px;
            right: -2px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background-color: var(--color-blush);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
          }

          .avatar-modal-actions {
            display: flex;
            justify-content: flex-end;
            margin-top: 4px;
          }
        `}</style>
      </Layout>
    </ProtectedRoute>
  )
}
