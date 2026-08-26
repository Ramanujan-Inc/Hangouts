import React from 'react'
import { Mail, Check, X } from 'lucide-react'
import { Button } from '../ui'
import { GroupInvite } from './types'

interface GroupInvitesSectionProps {
  invites: GroupInvite[]
  respondingInviteId: string | null
  onRespond: (groupId: string, action: 'accept' | 'decline', groupName?: string) => void
}

export const GroupInvitesSection: React.FC<GroupInvitesSectionProps> = ({
  invites,
  respondingInviteId,
  onRespond,
}) => {
  if (invites.length === 0) return null

  return (
    <div className="pending-invites-section">
      <div className="invites-title-row">
        <Mail size={16} className="invite-icon" />
        <h3>Invitations ({invites.length})</h3>
      </div>

      <div className="invites-grid">
        {invites.map((invite) => {
          const group = invite.group
          const inviterName = invite.inviter?.username || 'A friend'
          const isResponding = respondingInviteId === invite.group_id

          return (
            <div key={invite.id} className="invite-card">
              <div
                className="invite-cover-thumbnail"
                style={{
                  backgroundImage: group?.cover_image_url
                    ? `url(${group.cover_image_url})`
                    : 'linear-gradient(135deg, var(--color-surface-container), var(--tint-butter))',
                }}
              />
              <div className="invite-content">
                <div className="invite-info">
                  <h4 className="invite-group-name">{group?.name || 'Hangout Group'}</h4>
                  <p className="invite-from">
                    Invited by <strong>@{inviterName}</strong>
                  </p>
                </div>

                <div className="invite-actions">
                  <Button
                    variant="primary"
                    size="small"
                    disabled={isResponding}
                    onClick={() => onRespond(invite.group_id, 'accept', group?.name)}
                  >
                    <Check size={14} />
                    <span>{isResponding ? 'Joining...' : 'Accept'}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="small"
                    disabled={isResponding}
                    onClick={() => onRespond(invite.group_id, 'decline', group?.name)}
                  >
                    <X size={14} />
                    <span>Decline</span>
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <style jsx>{`
        .pending-invites-section {
          margin-bottom: 28px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .invites-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--color-tangerine);
        }

        .invites-title-row h3 {
          font-size: 15px;
          font-family: var(--font-display);
          font-weight: 700;
          color: var(--color-text);
          margin: 0;
        }

        .invites-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .invite-card {
          display: flex;
          gap: 16px;
          align-items: center;
          padding: 6px 0;
        }

        .invite-cover-thumbnail {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          background-size: cover;
          background-position: center;
          flex-shrink: 0;
        }

        .invite-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
          min-width: 0;
        }

        .invite-group-name {
          font-size: 15px;
          font-family: var(--font-display);
          font-weight: 700;
          color: var(--color-text);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .invite-from {
          font-size: 12px;
          color: var(--color-text-muted);
          margin: 0;
        }

        .invite-from strong {
          color: var(--color-text);
        }

        .invite-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 2px;
        }
      `}</style>
    </div>
  )
}
