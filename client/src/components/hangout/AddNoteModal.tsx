import React, { useState } from 'react'
import { Modal, TextArea, Button } from '../ui'
import { NoteType } from './types'

interface AddNoteModalProps {
  isOpen: boolean
  onClose: () => void
  onAddNote: (text: string, type: NoteType) => void
}

export const AddNoteModal: React.FC<AddNoteModalProps> = ({
  isOpen,
  onClose,
  onAddNote,
}) => {
  const [newNoteText, setNewNoteText] = useState('')
  const [newNoteType, setNewNoteType] = useState<NoteType>('butter')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNoteText.trim()) return

    onAddNote(newNoteText.trim(), newNoteType)
    setNewNoteText('')
    setNewNoteType('butter')
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
            {(['butter', 'blush', 'sea'] as const).map((type) => (
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

        <div className="modal-btn-row">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit">Post Note</Button>
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
