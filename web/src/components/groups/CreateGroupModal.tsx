import React, { useState } from 'react'
import { Upload, Camera, Check } from 'lucide-react'
import { Modal, TextField, Button } from '../ui'
import { api } from '../../lib/api'
import { PRESET_COVERS } from './types'
import { MemberInviteInput, InvitedMember } from './MemberInviteInput'

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string, coverImageUrl: string, inviteUsernames?: string[]) => Promise<void>
  onNotify?: (message: string) => void
  creating?: boolean
  currentUsername?: string
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  onNotify,
  creating = false,
  currentUsername,
}) => {
  const [newGroupName, setNewGroupName] = useState('')
  const [selectedCover, setSelectedCover] = useState(PRESET_COVERS[0])
  const [customCoverPreview, setCustomCoverPreview] = useState<string | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [invitedMembers, setInvitedMembers] = useState<InvitedMember[]>([])

  if (!isOpen) return null

  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const previewUrl = URL.createObjectURL(file)
    setCustomCoverPreview(previewUrl)
    setSelectedCover(previewUrl)

    try {
      setUploadingCover(true)
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.upload<{ url: string }>('/groups/cover', formData)
      if (res?.url) {
        setSelectedCover(res.url)
        onNotify?.('Cover photo uploaded!')
      }
    } catch (err: any) {
      onNotify?.(err?.message || 'Failed to upload photo')
    } finally {
      setUploadingCover(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName.trim()) return

    const usernames = invitedMembers.map((m) => m.username)
    await onCreate(newGroupName.trim(), selectedCover, usernames)
    setNewGroupName('')
    setCustomCoverPreview(null)
    setSelectedCover(PRESET_COVERS[0])
    setInvitedMembers([])
  }

  return (
    <Modal title="Create New Group" onClose={onClose}>
      <form onSubmit={handleSubmit} className="modal-form">
        <TextField
          label="Group Name"
          placeholder="e.g. Weekend Warriors, College Barkada"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          required
        />

        {/* Reusable Invite Members Component */}
        <MemberInviteInput
          invitedMembers={invitedMembers}
          onInvitedMembersChange={setInvitedMembers}
          currentUsername={currentUsername}
          label="Invite Members (Optional)"
          placeholder="Enter username (e.g. jam, dave)"
        />

        <div className="cover-picker-section">
          <label className="picker-label">Group Cover Photo</label>

          {/* Upload custom file option */}
          <label className="upload-cover-box">
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverFileUpload}
              style={{ display: 'none' }}
            />
            {customCoverPreview ? (
              <div
                className="custom-preview-cover"
                style={{ backgroundImage: `url(${customCoverPreview})` }}
              >
                <div className="change-photo-badge">
                  <Camera size={14} />
                  <span>{uploadingCover ? 'Uploading...' : 'Change Photo'}</span>
                </div>
              </div>
            ) : (
              <div className="upload-placeholder">
                <Upload size={18} className="upload-icon" />
                <span>{uploadingCover ? 'Uploading photo...' : 'Upload photo from device'}</span>
              </div>
            )}
          </label>

          <div className="divider-label">
            <span>or choose a preset theme</span>
          </div>

          <div className="cover-options">
            {PRESET_COVERS.map((cover, idx) => (
              <div
                key={idx}
                className={`cover-option ${selectedCover === cover && !customCoverPreview ? 'selected' : ''}`}
                style={{ backgroundImage: `url(${cover})` }}
                onClick={() => {
                  setCustomCoverPreview(null)
                  setSelectedCover(cover)
                }}
              >
                {selectedCover === cover && !customCoverPreview && (
                  <div className="check-overlay">
                    <Check size={16} color="white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <Button variant="outline" size="default" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" size="default" disabled={creating || !newGroupName.trim()}>
            {creating ? 'Creating...' : 'Create Group'}
          </Button>
        </div>
      </form>

      <style jsx>{`
        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .cover-picker-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .picker-label {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 14px;
          color: var(--color-text);
        }

        .upload-cover-box {
          border: 2px dashed var(--color-outline-variant);
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: border-color 0.2s, background-color 0.2s;
          display: block;
        }

        .upload-cover-box:hover {
          border-color: var(--color-blush);
          background-color: var(--color-surface-container-low);
        }

        .upload-placeholder {
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: var(--color-text-muted);
          font-size: 13px;
          font-weight: 600;
        }

        .custom-preview-cover {
          height: 120px;
          background-size: cover;
          background-position: center;
          position: relative;
          display: flex;
          align-items: flex-end;
          justify-content: flex-end;
          padding: 10px;
        }

        .change-photo-badge {
          background-color: rgba(46, 42, 40, 0.75);
          color: white;
          padding: 6px 12px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
          backdrop-filter: blur(4px);
        }

        .divider-label {
          text-align: center;
          position: relative;
          margin: 4px 0;
        }

        .divider-label span {
          font-size: 12px;
          color: var(--color-text-muted);
          font-weight: 600;
        }

        .cover-options {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        .cover-option {
          height: 60px;
          border-radius: 12px;
          background-size: cover;
          background-position: center;
          cursor: pointer;
          position: relative;
          border: 2px solid transparent;
          transition: transform 0.2s, border-color 0.2s;
        }

        .cover-option:hover {
          transform: scale(1.04);
        }

        .cover-option.selected {
          border-color: var(--color-blush);
        }

        .check-overlay {
          position: absolute;
          inset: 0;
          background-color: rgba(227, 104, 136, 0.5);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 8px;
        }
      `}</style>
    </Modal>
  )
}
