import React from 'react'
import { Upload, Loader2, Check } from 'lucide-react'
import { Modal, Button } from '../ui'
import { profileAvatars } from '../../data/mock'

interface AvatarPickerModalProps {
  isOpen: boolean
  currentAvatar: string
  isUpdatingAvatar: boolean
  onClose: () => void
  onUploadFile: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  onSelectPreset: (presetUrl: string) => Promise<void>
}

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  isOpen,
  currentAvatar,
  isUpdatingAvatar,
  onClose,
  onUploadFile,
  onSelectPreset,
}) => {
  if (!isOpen) return null

  return (
    <Modal title="Choose Profile Picture" onClose={onClose}>
      <div className="avatar-modal-body">
        {/* Upload Custom File */}
        <label className="upload-avatar-box">
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={onUploadFile}
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

        {/* Preset Avatars Grid */}
        <div className="preset-avatars-grid">
          {profileAvatars.map((avatarUrl, idx) => {
            const isSelected = currentAvatar === avatarUrl
            return (
              <div
                key={idx}
                className={`preset-avatar-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectPreset(avatarUrl)}
                title={`Select preset ${idx + 1}`}
                role="button"
                tabIndex={0}
              >
                <img
                  src={avatarUrl}
                  alt={`Preset avatar ${idx + 1}`}
                  className="preset-img"
                />
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
          <Button variant="outline" size="small" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>

      <style jsx>{`
        .avatar-modal-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .upload-avatar-box {
          border: 2px dashed var(--color-outline-variant);
          border-radius: 16px;
          padding: 20px;
          cursor: pointer;
          transition: border-color 0.2s, background-color 0.2s;
          display: block;
        }

        .upload-avatar-box:hover {
          border-color: var(--color-blush);
          background-color: var(--color-surface-container-low);
        }

        .upload-avatar-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: var(--color-text-muted);
        }

        .upload-text {
          font-size: 13px;
          font-weight: 600;
        }

        :global(.spin-icon) {
          animation: spin 0.8s linear infinite;
        }

        .avatar-modal-divider {
          text-align: center;
          margin: 4px 0;
        }

        .avatar-modal-divider span {
          font-size: 12px;
          color: var(--color-text-muted);
          font-weight: 600;
        }

        .preset-avatars-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .preset-avatar-item {
          aspect-ratio: 1;
          border-radius: 16px;
          border: 2px solid transparent;
          overflow: hidden;
          cursor: pointer;
          position: relative;
          background-color: var(--color-surface-container);
          transition: transform 0.15s, border-color 0.15s;
        }

        .preset-avatar-item:hover {
          transform: scale(1.06);
        }

        .preset-avatar-item.selected {
          border-color: var(--color-blush);
        }

        .preset-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .preset-check-badge {
          position: absolute;
          bottom: 4px;
          right: 4px;
          background-color: var(--color-blush);
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .avatar-modal-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 8px;
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
    </Modal>
  )
}
