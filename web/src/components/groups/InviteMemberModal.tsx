import React, { useState, useRef } from 'react'
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
    onClose()
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
