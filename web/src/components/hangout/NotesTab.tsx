import React from 'react'
import { Plus, FileText, Trash2, Lock } from 'lucide-react'
import { Button, EmptyState } from '../ui'
import MemberAvatar from '../MemberAvatar'
import { formatDate } from '../../lib/format'
import { HangoutNote } from './types'

interface NotesTabProps {
  notes: HangoutNote[]
  currentUserId: string
  onOpenAddNote: () => void
  onDeleteNote: (noteId: string) => void
}

const noteStyles = ['butter', 'blush', 'sea', 'matcha'] as const

export const NotesTab: React.FC<NotesTabProps> = ({
  notes,
  currentUserId,
  onOpenAddNote,
  onDeleteNote,
}) => {
  return (
    <div className="notes-tab">
      <div className="tab-section-header">
        <h3>Sticky Notes ({notes.length})</h3>
        <Button size="compact" onClick={onOpenAddNote}>
          <Plus size={16} /> Add Note
        </Button>
      </div>

      {notes.length === 0 ? (
        <EmptyState
          icon={<FileText size={32} />}
          title="No notes written yet. Jot down funny quotes or memories!"
        />
      ) : (
        <div className="sticky-notes-board">
          {notes.map((note, idx) => {
            const styleType = note.color || note.type || noteStyles[idx % noteStyles.length]
            const rotation = note.rotation !== undefined ? note.rotation : (idx % 2 === 0 ? 1 : -1) * 1.5
            const isAuthor = String(note.created_by) === String(currentUserId)
            const authorName = note.author?.username || note.created_by || 'Member'
            const timeLabel = note.created_at ? formatDate(note.created_at, 'short') : 'Just now'

            return (
              <div
                key={note.id}
                className={`sticky-note sticky-note-${styleType}`}
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                <div className="sticky-header">
                  {!note.is_shared && (
                    <span className="private-pill" title="Only you can see this note">
                      <Lock size={10} /> Private
                    </span>
                  )}
                  {isAuthor && (
                    <button
                      type="button"
                      className="delete-note-btn"
                      onClick={() => onDeleteNote(note.id)}
                      title="Delete note"
                      aria-label="Delete note"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                <p className="note-text">"{note.content}"</p>

                <div className="note-meta-footer">
                  <div className="note-author">
                    <MemberAvatar profile={note.author} memberId={note.created_by} size={20} />
                    <span>{authorName}</span>
                  </div>
                  <span className="note-time">{timeLabel}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <style jsx>{`
        .notes-tab {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .tab-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .tab-section-header h3 {
          font-size: 18px;
          margin: 0;
          color: var(--color-text);
        }

        .sticky-notes-board {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
          padding: 10px 4px;
        }

        .sticky-note {
          padding: 16px;
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          min-height: 140px;
          box-shadow: 0 4px 12px rgba(46, 42, 40, 0.08);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .sticky-note:hover {
          transform: scale(1.03) !important;
          box-shadow: 0 8px 20px rgba(46, 42, 40, 0.14);
        }

        .sticky-note-butter {
          background-color: var(--note-butter-bg);
          border: 1px solid var(--note-butter-border);
        }
        .sticky-note-butter .note-text,
        .sticky-note-butter .note-author {
          color: var(--note-butter-text);
        }
        .sticky-note-butter .note-time {
          color: var(--note-butter-muted);
        }

        .sticky-note-blush {
          background-color: var(--note-blush-bg);
          border: 1px solid var(--note-blush-border);
        }
        .sticky-note-blush .note-text,
        .sticky-note-blush .note-author {
          color: var(--note-blush-text);
        }
        .sticky-note-blush .note-time {
          color: var(--note-blush-muted);
        }

        .sticky-note-sea {
          background-color: var(--note-sea-bg);
          border: 1px solid var(--note-sea-border);
        }
        .sticky-note-sea .note-text,
        .sticky-note-sea .note-author {
          color: var(--note-sea-text);
        }
        .sticky-note-sea .note-time {
          color: var(--note-sea-muted);
        }

        .sticky-note-matcha {
          background-color: var(--note-matcha-bg);
          border: 1px solid var(--note-matcha-border);
        }
        .sticky-note-matcha .note-text,
        .sticky-note-matcha .note-author {
          color: var(--note-matcha-text);
        }
        .sticky-note-matcha .note-time {
          color: var(--note-matcha-muted);
        }

        .sticky-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .private-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 700;
          background: rgba(0, 0, 0, 0.12);
          color: inherit;
          padding: 2px 6px;
          border-radius: 6px;
        }

        .delete-note-btn {
          margin-left: auto;
          background: transparent;
          border: none;
          color: inherit;
          opacity: 0.65;
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: opacity 0.15s, color 0.15s;
        }

        .delete-note-btn:hover {
          opacity: 1;
          color: #ff6b6b;
        }

        .note-text {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 600;
          line-height: 1.4;
          margin: 0 0 16px 0;
        }

        .note-meta-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
        }

        .note-author {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
        }

        .note-time {
          font-size: 11px;
        }
      `}</style>
    </div>
  )
}
