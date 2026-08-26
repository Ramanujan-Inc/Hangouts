import React, { useState } from 'react'
import { Plus, X, Loader2, UserPlus } from 'lucide-react'
import { Button } from '../ui'
import { api } from '../../lib/api'
import { getAvatarUrl } from '../../lib/avatar'

export interface InvitedMember {
  username: string
  avatar_url?: string
}

interface MemberInviteInputProps {
  invitedMembers: InvitedMember[]
  onInvitedMembersChange: (members: InvitedMember[]) => void
  currentUsername?: string
  existingMembers?: { username?: string; user_id?: string; status?: string; profile?: { id?: string; username?: string } }[]
  label?: string
  placeholder?: string
  autoFocus?: boolean
  pendingInputRef?: React.MutableRefObject<string>
}

export const MemberInviteInput: React.FC<MemberInviteInputProps> = ({
  invitedMembers,
  onInvitedMembersChange,
  currentUsername,
  existingMembers = [],
  label = 'Invite Members (Optional)',
  placeholder = 'Enter username (e.g. jam, dave, chloe)',
  autoFocus = false,
  pendingInputRef,
}) => {
  const [inviteInput, setInviteInput] = useState('')
  const [isSearchingUser, setIsSearchingUser] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  const handleInputChange = (val: string) => {
    setInviteInput(val)
    if (pendingInputRef) pendingInputRef.current = val
    if (inviteError) setInviteError(null)
  }

  const handleAddInvite = async () => {
    const username = inviteInput.trim().toLowerCase()
    if (!username) return

    if (currentUsername && username === currentUsername.toLowerCase()) {
      setInviteError("You can't invite yourself.")
      return
    }

    if (invitedMembers.some((m) => m.username.toLowerCase() === username)) {
      setInviteError(`@${username} is already in the invite list.`)
      return
    }

    const existingBefore = existingMembers.find((m) => {
      const u = m.profile?.username || m.username
      return u && u.toLowerCase() === username
    })

    if (existingBefore) {
      if (existingBefore.status === 'pending') {
        setInviteError(`@${username} has already been invited to this group.`)
      } else {
        setInviteError(`@${username} is already a member of this group.`)
      }
      return
    }

    setIsSearchingUser(true)
    setInviteError(null)
    try {
      const profile = await api.get<any>(`/profiles/${encodeURIComponent(username)}`)
      if (profile && profile.username) {
        // Check if user is already an accepted member or has a pending invite
        const existingAfter = existingMembers.find((m) => {
          const u = m.profile?.username || m.username
          const uMatch = u && u.toLowerCase() === profile.username.toLowerCase()
          const idMatch = m.user_id && (m.user_id === profile.id || m.profile?.id === profile.id)
          return uMatch || idMatch
        })

        if (existingAfter) {
          if (existingAfter.status === 'pending') {
            setInviteError(`@${profile.username} has already been invited to this group.`)
          } else {
            setInviteError(`@${profile.username} is already a member of this group.`)
          }
          return
        }

        onInvitedMembersChange([
          ...invitedMembers,
          {
            username: profile.username,
            avatar_url: profile.avatar_url,
          },
        ])
        handleInputChange('')
      } else {
        setInviteError(`No user found with username "${username}".`)
      }
    } catch (err: any) {
      setInviteError(`No user found with username "${username}".`)
    } finally {
      setIsSearchingUser(false)
    }
  }

  const handleRemoveInvite = (usernameToRemove: string) => {
    onInvitedMembersChange(invitedMembers.filter((m) => m.username !== usernameToRemove))
  }

  return (
    <div className="invite-members-section">
      {label && (
        <label className="picker-label">
          <UserPlus size={16} />
          <span>{label}</span>
        </label>
      )}

      <div className="invite-input-row">
        <input
          type="text"
          className="invite-username-input"
          placeholder={placeholder}
          value={inviteInput}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAddInvite()
            }
          }}
          autoFocus={autoFocus}
        />
        <Button
          type="button"
          variant="outline"
          size="compact"
          onClick={handleAddInvite}
          disabled={isSearchingUser || !inviteInput.trim()}
        >
          {isSearchingUser ? (
            <Loader2 size={14} className="spin-icon" />
          ) : (
            <Plus size={14} />
          )}
          <span>Invite</span>
        </Button>
      </div>

      {inviteError && <p className="invite-error-msg">{inviteError}</p>}

      {invitedMembers.length > 0 && (
        <div className="invited-chips-list">
          {invitedMembers.map((member) => {
            const avatarUrl = getAvatarUrl(member.avatar_url)

            return (
              <div key={member.username} className="invited-chip">
                <img
                  src={avatarUrl}
                  alt={member.username}
                  className="chip-avatar"
                />
                <span className="chip-username">@{member.username}</span>
                <button
                  type="button"
                  className="chip-remove-btn"
                  onClick={() => handleRemoveInvite(member.username)}
                  aria-label={`Remove ${member.username}`}
                >
                  <X size={12} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <style jsx>{`
        .invite-members-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .picker-label {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 14px;
          color: var(--color-text);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .invite-input-row {
          display: flex;
          gap: 8px;
        }

        .invite-username-input {
          flex: 1;
          background-color: var(--color-surface-container-low);
          border: 1px solid var(--color-surface-container-high);
          border-radius: 12px;
          padding: 8px 14px;
          font-size: 13px;
          color: var(--color-text);
          outline: none;
          transition: border-color 0.2s, background-color 0.2s;
        }

        .invite-username-input:focus {
          border-color: var(--color-blush);
          background-color: var(--color-surface-container-lowest);
        }

        :global(.spin-icon) {
          animation: spin 0.8s linear infinite;
        }

        .invite-error-msg {
          font-size: 12px;
          color: var(--color-blush);
          font-weight: 600;
          margin: -4px 0 0 0;
        }

        .invited-chips-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding-top: 4px;
        }

        .invited-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background-color: var(--color-surface-container-low);
          border: 1px solid var(--color-surface-container-high);
          padding: 4px 10px 4px 6px;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text);
          animation: fadeIn 0.2s ease-out;
        }

        .chip-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          object-fit: cover;
          background-color: var(--color-surface-container);
        }

        .chip-username {
          font-size: 12px;
          font-weight: 700;
        }

        .chip-remove-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2px;
          border-radius: 50%;
          transition: background-color 0.15s, color 0.15s;
        }

        .chip-remove-btn:hover {
          background-color: var(--color-surface-container-high);
          color: var(--color-blush);
        }
      `}</style>
    </div>
  )
}
