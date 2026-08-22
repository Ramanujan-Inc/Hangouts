import React, { useState } from 'react'
import { Modal, TextField, Button } from '../ui'
import { Group } from './types'

interface InviteMemberModalProps {
  group: Group | null
  isOpen: boolean
  onClose: () => void
  onInvite: (username: string) => Promise<void>
  inviting?: boolean
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  group,
  isOpen,
  onClose,
  onInvite,
  inviting = false,
}) => {
  const [inviteUsername, setInviteUsername] = useState('')

  if (!isOpen || !group) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteUsername.trim()) return

    await onInvite(inviteUsername.trim())
    setInviteUsername('')
  }

  return (
    <Modal title={`Invite to "${group.name}"`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="modal-form">
        <p className="modal-desc">
          Enter the username of the friend you want to invite to this group.
        </p>

        <TextField
          label="Username"
          placeholder="e.g. jam, dave, chloe"
          value={inviteUsername}
          onChange={(e) => setInviteUsername(e.target.value)}
          required
        />

        <div className="modal-actions">
          <Button variant="outline" size="default" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            type="submit"
            size="default"
            disabled={inviting || !inviteUsername.trim()}
          >
            {inviting ? 'Inviting...' : 'Send Invite'}
          </Button>
        </div>
      </form>

      <style jsx>{`
        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
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
