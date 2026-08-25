import React from 'react'
import { Users, Plus, Check, Loader2 } from 'lucide-react'
import { GroupMemberProfile } from './types'

interface ParticipantSelectorProps {
  activeMembersList: GroupMemberProfile[]
  selectedParticipants: string[]
  selectedGroupId: string
  loadingMembers: boolean
  onToggleParticipant: (id: string) => void
  onSelectAll: () => void
  onOpenAddAttendeeModal: () => void
}

export const ParticipantSelector: React.FC<ParticipantSelectorProps> = ({
  activeMembersList,
  selectedParticipants,
  selectedGroupId,
  loadingMembers,
  onToggleParticipant,
  onSelectAll,
  onOpenAddAttendeeModal,
}) => {
  const isAllSelected =
    activeMembersList.length > 0 && selectedParticipants.length === activeMembersList.length

  return (
    <div className="input-group">
      <div className="label-row-with-action">
        <label className="field-label">
          <Users size={16} /> Attendees
        </label>
        {activeMembersList.length > 0 && (
          <span className="action-text" onClick={onSelectAll}>
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </span>
        )}
      </div>

      {loadingMembers ? (
        <div className="members-loading">
          <Loader2 size={16} className="spin-icon" />
          <span>Loading attendees...</span>
        </div>
      ) : activeMembersList.length === 0 ? (
        <div className="empty-attendees-card">
          <p className="no-members-hint">
            {selectedGroupId
              ? 'No other members in this group yet.'
              : 'No circle members found.'}
          </p>
          {!selectedGroupId && (
            <button
              type="button"
              className="add-by-username-btn"
              onClick={onOpenAddAttendeeModal}
            >
              <Plus size={14} />
              <span>Search & Add User by Username</span>
            </button>
          )}
        </div>
      ) : (
        <div className="participants-scroll">
          {activeMembersList.map((member) => {
            const isSelected = selectedParticipants.includes(member.id)
            const avatarUrl =
              member.avatar_url ||
              `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(member.username)}`

            return (
              <div
                key={member.id}
                className={`participant-chip ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggleParticipant(member.id)}
                role="button"
                tabIndex={0}
              >
                <div className="avatar-wrapper">
                  <img src={avatarUrl} alt={member.username} />
                  {isSelected && (
                    <div className="check-badge">
                      <Check size={8} strokeWidth={4} />
                    </div>
                  )}
                </div>
                <span className="chip-name">{member.username}</span>
              </div>
            )
          })}

          {!selectedGroupId && (
            <div
              className="participant-chip add-more-chip"
              onClick={onOpenAddAttendeeModal}
              title="Search & add user by username"
              role="button"
              tabIndex={0}
            >
              <div className="avatar-wrapper add-avatar">
                <Plus size={20} />
              </div>
              <span className="chip-name">Add User</span>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .label-row-with-action {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .field-label {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 14px;
          color: var(--color-text);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .action-text {
          font-size: 12px;
          color: var(--color-sea);
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.15s;
        }

        .action-text:hover {
          opacity: 0.8;
          text-decoration: underline;
        }

        .members-loading {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--color-text-muted);
          font-size: 13px;
          padding: 12px;
        }

        :global(.spin-icon) {
          animation: spin 0.8s linear infinite;
        }

        .empty-attendees-card {
          padding: 16px;
          border-radius: 16px;
          background-color: var(--color-surface-container-low);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .no-members-hint {
          font-size: 13px;
          color: var(--color-text-muted);
          margin: 0;
        }

        .add-by-username-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background-color: var(--color-surface-container-lowest);
          border: 1px solid var(--color-outline-variant);
          padding: 8px 14px;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 700;
          color: var(--color-sea);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .add-by-username-btn:hover {
          border-color: var(--color-sea);
          background-color: var(--tint-sea);
        }

        .participants-scroll {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 8px;
        }

        .participant-chip {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 8px;
          border-radius: 16px;
          cursor: pointer;
          min-width: 68px;
          transition: background-color 0.15s, transform 0.15s;
        }

        .participant-chip:hover {
          background-color: var(--color-surface-container-low);
          transform: translateY(-2px);
        }

        .participant-chip.selected {
          background-color: var(--tint-blush);
        }

        .avatar-wrapper {
          position: relative;
          width: 44px;
          height: 44px;
        }

        .avatar-wrapper img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          background-color: var(--color-surface-container);
        }

        .check-badge {
          position: absolute;
          bottom: 0;
          right: 0;
          background-color: var(--color-blush);
          color: white;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--color-surface-container-lowest);
        }

        .chip-name {
          font-size: 12px;
          font-weight: 700;
          color: var(--color-text);
          text-align: center;
          max-width: 64px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .add-avatar {
          border: 2px dashed var(--color-outline-variant);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
          background-color: var(--color-surface-container-low);
        }

        .add-more-chip:hover .add-avatar {
          border-color: var(--color-blush);
          color: var(--color-blush);
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
    </div>
  )
}
