import React, { useState } from 'react'
import { AlignLeft } from 'lucide-react'
import { TextArea, ActionButton } from '../ui'

interface TitleDescriptionInputProps {
  title: string
  description: string
  onTitleChange: (val: string) => void
  onDescriptionChange: (val: string) => void
}

export const TitleDescriptionInput: React.FC<TitleDescriptionInputProps> = ({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
}) => {
  const [showDescription, setShowDescription] = useState(Boolean(description))

  return (
    <div className="title-desc-container">
      <div className="input-group">
        <div className="label-row-with-action">
          <label className="field-label">Hangout Title</label>
          {!showDescription && !description ? (
            <ActionButton
              icon={<AlignLeft size={13} />}
              onClick={() => setShowDescription(true)}
            >
              + Add description
            </ActionButton>
          ) : (
            <ActionButton
              onClick={() => {
                setShowDescription(false)
                onDescriptionChange('')
              }}
            >
              Remove description
            </ActionButton>
          )}
        </div>
        <input
          className="pill-input"
          required
          placeholder="e.g. Friday Night Ramen"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
        />
      </div>

      {(showDescription || description) && (
        <div className="description-input-wrapper">
          <TextArea
            placeholder="What are we doing? Write down any notes, funny moments, or plans..."
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            autoFocus
          />
        </div>
      )}

      <style jsx>{`
        .title-desc-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

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

        .description-input-wrapper {
          display: flex;
          flex-direction: column;
          gap: 8px;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
