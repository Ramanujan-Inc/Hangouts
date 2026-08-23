import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import Layout from '../components/Layout'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { useAuth } from '../context/AuthContext'
import { api, ApiError } from '../lib/api'
import { LogOut } from 'lucide-react'
import { profileAvatars } from '../data/mock'
import { Toast } from '../components/ui'
import {
  StorageUsage,
  ProfileHeaderCard,
  StorageUsageCard,
  AvatarPickerModal,
  SettingsLinksCard,
} from '../components/profile'

export default function ProfileSettings() {
  const router = useRouter()
  const { user, logout, refreshUser } = useAuth()
  const [avatarIndex, setAvatarIndex] = useState(0)
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [isSavingName, setIsSavingName] = useState(false)
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const { data: storageUsageData, isLoading: loadingStorage } = useSWR<StorageUsage>('/storage/usage')
  const storageUsage = storageUsageData || {
    used_bytes: 0,
    max_bytes: 500 * 1024 * 1024,
    percentage_used: 0.0,
  }

  const displayName = user?.username || 'User'
  const displayEmail = user?.email || ''
  const currentAvatar = user?.avatar_url || profileAvatars[avatarIndex] || profileAvatars[0]

  useEffect(() => {
    if (user?.avatar_url) {
      const idx = profileAvatars.indexOf(user.avatar_url)
      if (idx !== -1) {
        setAvatarIndex(idx)
      }
    }
  }, [user])

  const showToast = (msg: string) => {
    setToastMessage(msg)
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

  const handleSaveName = async (newName: string) => {
    setNameError(null)
    try {
      setIsSavingName(true)
      await api.patch('/profiles/me', { username: newName })
      await refreshUser()
      showToast('Profile name updated!')
    } catch (err: any) {
      console.error('Failed to update username:', err)
      if (err instanceof ApiError) {
        setNameError(err.message)
      } else {
        setNameError(err?.message || 'Failed to update username')
      }
      throw err
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
          <Toast
            message={toastMessage}
            isOpen={Boolean(toastMessage)}
            onClose={() => setToastMessage('')}
          />

          <h2 className="page-heading">Settings</h2>

          {/* Profile Card Header */}
          <ProfileHeaderCard
            displayName={displayName}
            displayEmail={displayEmail}
            currentAvatar={currentAvatar}
            isUpdatingAvatar={isUpdatingAvatar}
            onOpenAvatarModal={() => setIsAvatarModalOpen(true)}
            onSaveName={handleSaveName}
            isSavingName={isSavingName}
            nameError={nameError}
            onClearNameError={() => setNameError(null)}
          />

          {/* Storage Usage Section */}
          <StorageUsageCard
            storageUsage={storageUsage}
            loading={loadingStorage}
          />

          {/* Settings Rows */}
          <SettingsLinksCard />

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
          <AvatarPickerModal
            isOpen={isAvatarModalOpen}
            currentAvatar={currentAvatar}
            isUpdatingAvatar={isUpdatingAvatar}
            onClose={() => setIsAvatarModalOpen(false)}
            onUploadFile={handleAvatarFileUpload}
            onSelectPreset={handleSelectPreset}
          />
        </div>

        <style jsx>{`
          .profile-page-container {
            max-width: 600px;
            margin: 0 auto;
            position: relative;
            padding-bottom: 60px;
          }

          .page-heading {
            font-size: 28px;
            color: var(--color-text);
            margin-bottom: 24px;
          }

          .logout-btn-row {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 16px;
            border-radius: 16px;
            border: 1px solid var(--color-surface-container-high);
            background-color: var(--color-surface-container-lowest);
            color: var(--color-blush);
            font-family: var(--font-display);
            font-weight: 700;
            font-size: 15px;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: var(--shadow-ambient);
          }

          .logout-btn-row:hover {
            background-color: var(--tint-blush);
            border-color: var(--color-blush);
          }

          .attributions-footer {
            text-align: center;
            margin-top: 32px;
            padding: 16px 0;
            font-size: 12px;
            color: var(--color-text-muted);
            opacity: 0.8;
          }

          .attributions-footer a {
            color: var(--color-text-muted);
            text-decoration: underline;
          }
        `}</style>
      </Layout>
    </ProtectedRoute>
  )
}
