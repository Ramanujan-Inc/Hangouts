import React from 'react'
import { Mail, Check, X } from 'lucide-react'
import { Button, Card } from '../ui'
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
            <Card key={invite.id} variant="low" padding="none" className="invite-card">
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
            </Card>
          )
        })}
      </div>

      <style jsx>{`
        .pending-invites-section {
          margin-bottom: 32px;
          background-color: var(--tint-butter);
          border: 1px solid rgba(242, 216, 143, 0.6);
          border-radius: 24px;
          padding: 24px;
        }

        .invites-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          color: #85610e;
        }

        .invites-title-row h3 {
          font-size: 16px;
          color: #85610e;
          margin: 0;
        }

        .invites-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        :global(.invite-card) {
          display: flex;
          background-color: var(--color-surface-container-lowest) !important;
          border-radius: 16px !important;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(46, 42, 40, 0.04);
        }

        .invite-cover-thumbnail {
          width: 80px;
          min-height: 80px;
          background-size: cover;
          background-position: center;
          flex-shrink: 0;
        }

        .invite-content {
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          flex: 1;
          gap: 10px;
        }

        .invite-group-name {
          font-size: 15px;
          font-weight: 700;
          color: var(--color-text);
          margin: 0 0 2px 0;
        }

        .invite-from {
          font-size: 12px;
          color: var(--color-text-muted);
          margin: 0;
        }

        .invite-actions {
          display: flex;
          gap: 8px;
        }
      `}</style>
    </div>
  )
}
