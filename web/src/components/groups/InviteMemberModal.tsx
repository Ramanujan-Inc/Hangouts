import React, { useState, useRef } from 'react'
import { Copy, Check } from 'lucide-react'
import { Modal, Button } from '../ui'
import { Group } from './types'
import { MemberInviteInput, InvitedMember } from './MemberInviteInput'

interface InviteMemberModalProps {
  group: Group | null
  isOpen: boolean
  onClose: () => void
  onInvite: (usernames: string[]) => Promise<void>
  inviting?: boolean
  currentUsername?: string
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  group,
  isOpen,
  onClose,
  onInvite,
  inviting = false,
  currentUsername,
}) => {
  const [invitedMembers, setInvitedMembers] = useState<InvitedMember[]>([])
  const [copiedLink, setCopiedLink] = useState(false)
  const pendingInputRef = useRef('')


  if (!isOpen || !group) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const usernamesToInvite = [...invitedMembers.map((m) => m.username)]

    // If user typed into the input field without pressing "+ Invite", include that user
    const pending = pendingInputRef.current.trim().toLowerCase()
    if (pending && !usernamesToInvite.some((u) => u.toLowerCase() === pending)) {
      usernamesToInvite.push(pending)
    }

    if (usernamesToInvite.length === 0) return

    await onInvite(usernamesToInvite)
    setInvitedMembers([])
    pendingInputRef.current = ''
  }

  const handleClose = () => {
    setInvitedMembers([])
    pendingInputRef.current = ''
    setCopiedLink(false)
    onClose()
  }

  const handleCopyLink = async () => {
    if (!group?.invite_code) return
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/join/group/${group.invite_code}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  return (
    <Modal title={`Invite to "${group.name}"`} onClose={handleClose}>
      <form onSubmit={handleSubmit} className="modal-form">
        <p className="modal-desc">
          Enter usernames of friends you want to invite to <strong>{group.name}</strong>.
        </p>

        {/* Reusable Member Invite Input */}
        <MemberInviteInput
          invitedMembers={invitedMembers}
          onInvitedMembersChange={setInvitedMembers}
          currentUsername={currentUsername}
          existingMembers={group.members || []}
          label="Add Friends by Username"
          placeholder="Enter username (e.g. jam, dave, chloe)"
          autoFocus={true}
          pendingInputRef={pendingInputRef}
        />

        {/* Share Link Quick Action */}
        {group.invite_code && (
          <div className="share-link-section">
            <span className="share-link-title">Or share an invite link</span>
            <div className="share-link-row">
              <input
                type="text"
                readOnly
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/join/group/${group.invite_code}`}
                className="share-link-input"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                variant={copiedLink ? 'secondary' : 'outline'}
                size="small"
                onClick={handleCopyLink}
                type="button"
              >
                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
              </Button>
            </div>
          </div>
        )}

        <div className="modal-actions">
          <Button variant="outline" size="default" onClick={handleClose} type="button">
            Cancel
          </Button>
          <Button
            type="submit"
            size="default"
            disabled={inviting || (invitedMembers.length === 0 && !pendingInputRef.current.trim())}
          >
            {inviting
              ? 'Sending...'
              : invitedMembers.length > 1
              ? `Send Invites (${invitedMembers.length})`
              : 'Send Invite'}
          </Button>
        </div>
      </form>

      <style jsx>{`
        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .modal-desc {
          font-size: 14px;
          color: var(--color-text-muted);
          margin: 0;
        }

        .share-link-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 12px;
          background-color: var(--color-surface-container-low);
          border: 1px solid var(--color-surface-container-high);
          border-radius: 14px;
        }

        .share-link-title {
          font-size: 12px;
          font-weight: 700;
          color: var(--color-text-muted);
          font-family: var(--font-display);
        }

        .share-link-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .share-link-input {
          flex: 1;
          background-color: var(--color-surface-container);
          border: 1px solid var(--color-surface-container-high);
          border-radius: 8px;
          padding: 6px 10px;
          font-size: 12px;
          color: var(--color-text);
          font-family: inherit;
          outline: none;
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
