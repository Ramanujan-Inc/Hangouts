import React, { useState } from 'react'
import { Globe, Lock } from 'lucide-react'
import { Modal, TextArea, Button } from '../ui'
import { NoteType } from './types'

interface AddNoteModalProps {
  isOpen: boolean
  isSubmitting?: boolean
  onClose: () => void
  onAddNote: (text: string, isShared: boolean, type: NoteType) => void
}

export const AddNoteModal: React.FC<AddNoteModalProps> = ({
  isOpen,
  isSubmitting = false,
  onClose,
  onAddNote,
}) => {
  const [newNoteText, setNewNoteText] = useState('')
  const [newNoteType, setNewNoteType] = useState<NoteType>('butter')
  const [isShared, setIsShared] = useState(true)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNoteText.trim()) return

    onAddNote(newNoteText.trim(), isShared, newNoteType)
    setNewNoteText('')
    setNewNoteType('butter')
    setIsShared(true)
    onClose()
  }

  return (
    <Modal onClose={onClose} title="Write a Sticky Note">
      <form onSubmit={handleSubmit} className="note-modal-form">
        <TextArea
          required
          height={120}
          placeholder="Write down funny quotes, inside jokes, or anything memorable..."
          value={newNoteText}
          onChange={(e) => setNewNoteText(e.target.value)}
        />

        <div className="color-picker-row">
          <span className="picker-lbl">Note Style:</span>
          <div className="color-options">
            {(['butter', 'blush', 'sea', 'matcha'] as const).map((type) => (
              <button
                key={type}
                type="button"
                className={`color-dot note-${type} ${newNoteType === type ? 'active' : ''}`}
                onClick={() => setNewNoteType(type)}
                aria-label={`Select ${type} note style`}
              />
            ))}
          </div>
        </div>

        <div className="privacy-picker-row">
          <span className="picker-lbl">Privacy:</span>
          <div className="privacy-buttons">
            <button
              type="button"
              className={`privacy-pill-btn ${isShared ? 'active' : ''}`}
              onClick={() => setIsShared(true)}
            >
              <Globe size={14} /> Shared with Group
            </button>
            <button
              type="button"
              className={`privacy-pill-btn ${!isShared ? 'active' : ''}`}
              onClick={() => setIsShared(false)}
            >
              <Lock size={14} /> Private to Me
            </button>
          </div>
        </div>

        <div className="modal-btn-row">
          <Button variant="outline" onClick={onClose} type="button" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={!newNoteText.trim() || isSubmitting}>
            {isSubmitting ? 'Posting...' : 'Post Note'}
          </Button>
        </div>
      </form>

      <style jsx>{`
        .note-modal-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .color-picker-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .picker-lbl {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 14px;
          color: var(--color-text);
        }

        .color-options {
          display: flex;
          gap: 10px;
        }

        .privacy-picker-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .privacy-buttons {
          display: flex;
          gap: 8px;
          flex: 1;
        }

        .privacy-pill-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 10px;
          border-radius: 10px;
          border: 1px solid var(--color-surface-container-high);
          background-color: var(--color-surface-container-low);
          color: var(--color-text-muted);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
        }

        .privacy-pill-btn.active {
          background-color: var(--color-surface-container);
          border-color: var(--color-blush);
          color: var(--color-blush);
        }

        .color-dot {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          transition: transform 0.15s, border-color 0.15s;
        }

        .color-dot:hover {
          transform: scale(1.1);
        }

        .color-dot.active {
          border-color: var(--color-text);
          transform: scale(1.15);
        }

        .note-butter {
          background-color: var(--color-butter);
        }

        .note-blush {
          background-color: var(--color-blush);
        }

        .note-sea {
          background-color: var(--color-sea);
        }

        .note-matcha {
          background-color: var(--color-matcha);
        }

        .modal-btn-row {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 8px;
        }
      `}</style>
    </Modal>
  )
}
