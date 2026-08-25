import React, { useState } from 'react'
import { Plus, Check, Loader2, AlertCircle } from 'lucide-react'
import { Modal, Button } from '../ui'
import { api } from '../../lib/api'
import { getAvatarUrl } from '../../lib/avatar'
import { GroupMemberProfile } from './types'

interface AddAttendeeModalProps {
  isOpen: boolean
  onClose: () => void
  onAddUser: (profile: GroupMemberProfile) => void
  currentUserId?: string
}

export const AddAttendeeModal: React.FC<AddAttendeeModalProps> = ({
  isOpen,
  onClose,
  onAddUser,
  currentUserId,
}) => {
  const [attendeeSearchQuery, setAttendeeSearchQuery] = useState('')
  const [searchingUser, setSearchingUser] = useState(false)
  const [searchUserResult, setSearchUserResult] = useState<GroupMemberProfile | null>(null)
  const [searchUserError, setSearchUserError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSearchExactUser = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = attendeeSearchQuery.trim()
    if (!trimmed) return

    setSearchUserError(null)
    setSearchUserResult(null)
    setSearchingUser(true)

    try {
      const profile = await api.get<GroupMemberProfile>(
        `/profiles/${encodeURIComponent(trimmed)}`
      )
      if (profile && profile.username.toLowerCase() === trimmed.toLowerCase()) {
        if (currentUserId && profile.id === currentUserId) {
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
    onAddUser(profile)
    setAttendeeSearchQuery('')
    setSearchUserResult(null)
    setSearchUserError(null)
    onClose()
  }

  return (
    <Modal
      onClose={() => {
        setAttendeeSearchQuery('')
        setSearchUserResult(null)
        setSearchUserError(null)
        onClose()
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
              if (searchUserError) setSearchUserError(null)
              if (searchUserResult) setSearchUserResult(null)
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
          <div className="search-error-banner">
            <AlertCircle size={16} />
            <span>{searchUserError}</span>
          </div>
        )}

        {searchUserResult && (
          <div className="search-result-card">
            <img
              src={getAvatarUrl(searchUserResult.avatar_url)}
              alt={searchUserResult.username}
              className="found-user-avatar"
            />
            <div className="found-user-info">
              <span className="found-user-name">@{searchUserResult.username}</span>
            </div>
            <Button
              type="button"
              size="small"
              variant="primary"
              onClick={() => handleAddFoundUser(searchUserResult)}
            >
              <Plus size={14} />
              <span>Add as Attendee</span>
            </Button>
          </div>
        )}

        <div className="modal-footer-btns">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              setAttendeeSearchQuery('')
              setSearchUserResult(null)
              setSearchUserError(null)
              onClose()
            }}
          >
            Close
          </Button>
        </div>
      </div>

      <style jsx>{`
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
          gap: 8px;
        }

        .search-user-input {
          flex: 1;
        }

        :global(.spin-icon) {
          animation: spin 0.8s linear infinite;
        }

        .search-error-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 12px;
          background-color: var(--tint-blush);
          color: var(--color-blush);
          font-size: 13px;
          font-weight: 600;
        }

        .search-result-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 14px;
          background-color: var(--color-surface-container-low);
          border: 1px solid var(--color-surface-container);
        }

        .found-user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          background-color: var(--color-surface-container);
        }

        .found-user-info {
          flex: 1;
        }

        .found-user-name {
          font-weight: 700;
          font-size: 15px;
          color: var(--color-text);
        }

        .modal-footer-btns {
          margin-top: 4px;
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
