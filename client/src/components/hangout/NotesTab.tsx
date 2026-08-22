import React from 'react'
import { Plus, FileText } from 'lucide-react'
import { Button, EmptyState } from '../ui'
import MemberAvatar from '../MemberAvatar'
import { members } from '../../data/mock'
import { HangoutNote } from './types'

interface NotesTabProps {
  notes: HangoutNote[]
  onOpenAddNote: () => void
}

export const NotesTab: React.FC<NotesTabProps> = ({ notes, onOpenAddNote }) => {
  return (
    <div className="notes-tab">
      <div className="tab-section-header">
        <h3>Collaborative Sticky Notes</h3>
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
          {notes.map((note) => (
            <div
              key={note.id}
              className={`sticky-note sticky-note-${note.type}`}
              style={{ transform: `rotate(${note.rotation}deg)` }}
            >
              <p className="note-text">"{note.text}"</p>
              <div className="note-meta-footer">
                <div className="note-author">
                  <MemberAvatar memberId={note.author} size={20} />
                  <span>{members[note.author]?.name || note.author}</span>
                </div>
                <span className="note-time">{note.time}</span>
              </div>
            </div>
          ))}
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

        .note-text {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 600;
          color: var(--color-text);
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
          color: var(--color-text);
        }

        .note-time {
          font-size: 11px;
          color: var(--color-text-muted);
        }
      `}</style>
    </div>
  )
}
