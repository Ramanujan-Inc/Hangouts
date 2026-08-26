import React from 'react'
import { Users, UserPlus, LogOut } from 'lucide-react'
import { Modal, Button, Badge } from '../ui'
import { getAvatarUrl } from '../../lib/avatar'
import { Group } from './types'

interface GroupDetailModalProps {
  group: Group | null
  currentUserId?: string
  onClose: () => void
  onOpenInvite: (group: Group) => void
  onLeaveGroup: (groupId: string, groupName: string) => void
}

export const GroupDetailModal: React.FC<GroupDetailModalProps> = ({
  group,
  currentUserId,
  onClose,
  onOpenInvite,
  onLeaveGroup,
}) => {
  if (!group) return null

  const members = group.members || []

  return (
    <Modal title={group.name} onClose={onClose}>
      <div className="group-detail-modal">
        {/* Cover Banner */}
        <div
          className="detail-cover-banner"
          style={{
            backgroundImage: group.cover_image_url
              ? `url(${group.cover_image_url})`
              : 'linear-gradient(135deg, var(--color-surface-container), var(--tint-butter))',
          }}
        >
          <div className="cover-badge-container">
            <Badge variant="surface" size="sm" icon={<Users size={14} />}>
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </Badge>
          </div>
        </div>

        {/* Meta Info */}
        <div className="detail-meta-section">
          <p className="detail-created">
            Created on{' '}
            {new Date(group.created_at).toLocaleDateString(undefined, {
              dateStyle: 'medium',
            })}
          </p>
        </div>

        {/* Members Section */}
        <div className="detail-members-section">
          <div className="section-title-row">
            <h4>Members ({members.length})</h4>
            <Button
              variant="secondary"
              size="small"
              onClick={() => onOpenInvite(group)}
            >
              <UserPlus size={14} />
              <span>Invite</span>
            </Button>
          </div>

          <div className="members-list">
            {members.length === 0 ? (
              <p className="no-members">No active members found.</p>
            ) : (
              members.map((m) => {
                const isOwner = m.user_id === group.created_by
                const username = m.profile?.username || m.user_id || 'User'
                const avatarUrl = getAvatarUrl(m.profile?.avatar_url)

                return (
                  <div key={m.id} className="member-item">
                    <img
                      src={avatarUrl}
                      alt={username}
                      className="member-avatar"
                    />
                    <div className="member-info">
                      <span className="member-name">{username}</span>
                    </div>
                    {isOwner && (
                      <Badge variant="blush" size="sm">
                        Creator
                      </Badge>
                    )}
                    {m.status === 'pending' && (
                      <Badge variant="butter" size="sm">
                        Pending
                      </Badge>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="detail-modal-footer">
          <button
            className="leave-btn-modal"
            type="button"
            onClick={() => onLeaveGroup(group.id, group.name)}
          >
            <LogOut size={16} />
            <span>Leave Group</span>
          </button>
          <Button size="default" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>

      <style jsx>{`
        .group-detail-modal {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .detail-cover-banner {
          height: 140px;
          border-radius: 16px;
          background-size: cover;
          background-position: center;
          position: relative;
          display: flex;
          align-items: flex-end;
          padding: 12px;
        }

        .cover-badge-container {
          display: inline-block;
        }

        .detail-meta-section {
          padding-bottom: 4px;
        }

        .detail-created {
          font-size: 13px;
          color: var(--color-text-muted);
          margin: 0;
        }

        .detail-members-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .section-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .section-title-row h4 {
          font-size: 16px;
          margin: 0;
          color: var(--color-text);
        }

        .members-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 220px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .no-members {
          font-size: 14px;
          color: var(--color-text-muted);
          text-align: center;
          padding: 16px;
        }

        .member-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          border-radius: 12px;
          background-color: var(--color-surface-container-low);
        }

        .member-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
          background-color: var(--color-surface-container);
        }

        .member-info {
          flex: 1;
        }

        .member-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--color-text);
        }

        .detail-modal-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid var(--color-surface-container-high);
          margin-top: 4px;
        }

        .leave-btn-modal {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: var(--color-blush);
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          padding: 8px 0;
          transition: opacity 0.2s;
        }

        .leave-btn-modal:hover {
          opacity: 0.8;
          text-decoration: underline;
        }
      `}</style>
    </Modal>
  )
}
