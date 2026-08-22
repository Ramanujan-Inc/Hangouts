import React, { useState, useEffect } from 'react'
import { Camera, Sparkles, Pencil, AlertCircle, Loader2 } from 'lucide-react'
import { Card, Button } from '../ui'

interface ProfileHeaderCardProps {
  displayName: string
  displayEmail: string
  currentAvatar: string
  isUpdatingAvatar: boolean
  onOpenAvatarModal: () => void
  onSaveName: (newName: string) => Promise<void>
  isSavingName: boolean
  nameError: string | null
  onClearNameError: () => void
}

export const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({
  displayName,
  displayEmail,
  currentAvatar,
  isUpdatingAvatar,
  onOpenAvatarModal,
  onSaveName,
  isSavingName,
  nameError,
  onClearNameError,
}) => {
  const [isEditingName, setIsEditingName] = useState(false)
  const [tempName, setTempName] = useState(displayName)

  useEffect(() => {
    setTempName(displayName)
  }, [displayName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = tempName.trim()
    if (!trimmed) return
    if (trimmed === displayName) {
      setIsEditingName(false)
      return
    }

    await onSaveName(trimmed)
    setIsEditingName(false)
  }

  return (
    <Card variant="default" padding="lg" className="profile-header-card">
      {/* Sparkle Decorative Flourishes */}
      <Sparkles className="sparkle-flourish pos-left" size={20} />
      <Sparkles className="sparkle-flourish pos-right" size={24} />

      <div
        className={`avatar-edit-wrapper ${isUpdatingAvatar ? 'updating' : ''}`}
        onClick={onOpenAvatarModal}
        title="Click to change profile picture"
        role="button"
        tabIndex={0}
      >
        <img src={currentAvatar} alt="Profile Avatar" className="profile-avatar-img" />
        <div className="camera-badge">
          {isUpdatingAvatar ? (
            <Loader2 size={14} className="spin-icon" />
          ) : (
            <Camera size={14} />
          )}
        </div>
      </div>

      {isEditingName ? (
        <form onSubmit={handleSubmit} className="name-edit-form">
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
              if (nameError) onClearNameError()
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
                onClearNameError()
                setTempName(displayName)
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
                onClearNameError()
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

      <style jsx>{`
        :global(.profile-header-card) {
          text-align: center;
          margin-bottom: 24px;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .sparkle-flourish {
          position: absolute;
          color: var(--color-butter);
          pointer-events: none;
        }

        .pos-left {
          top: 20px;
          left: 24px;
          transform: rotate(-15deg);
        }

        .pos-right {
          bottom: 24px;
          right: 28px;
          transform: rotate(12deg);
        }

        .avatar-edit-wrapper {
          position: relative;
          width: 96px;
          height: 96px;
          margin: 0 auto 16px auto;
          cursor: pointer;
          border-radius: 50%;
          transition: transform 0.2s ease;
        }

        .avatar-edit-wrapper:hover {
          transform: scale(1.05);
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
          border: 3px solid var(--color-surface-container-lowest);
          box-shadow: 0 4px 12px rgba(46, 42, 40, 0.1);
          background-color: var(--color-surface-container);
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
          border: 2px solid var(--color-surface-container-lowest);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }

        :global(.spin-icon) {
          animation: spin 0.8s linear infinite;
        }

        .profile-name-block h3 {
          font-size: 22px;
          color: var(--color-text);
          margin: 0;
        }

        .profile-name-block p {
          font-size: 14px;
          color: var(--color-text-muted);
          margin-top: 4px;
          margin-bottom: 0;
        }

        .username-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .edit-name-icon-btn {
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 50%;
          transition: color 0.15s, background-color 0.15s;
        }

        .edit-name-icon-btn:hover {
          color: var(--color-blush);
          background-color: var(--color-surface-container);
        }

        .name-edit-form {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          width: 100%;
          max-width: 260px;
        }

        .error-box {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--color-blush);
          font-size: 12px;
          font-weight: 700;
        }

        .edit-btn-row {
          display: flex;
          gap: 8px;
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
    </Card>
  )
}
