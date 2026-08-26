import React from 'react'

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  icon?: React.ReactNode
  height?: number
}

export default function TextArea({ label, icon, height = 100, className = '', ...props }: TextAreaProps) {
  return (
    <>
      <div className="ta-group">
        {label && (
          <label className="field-label">
            {icon}
            {label}
          </label>
        )}
        <textarea className={`ta-input ${className}`} style={{ height }} {...props} />
      </div>
      <style jsx>{`
        .ta-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ta-input {
          width: 100%;
          background-color: var(--color-surface-container-lowest);
          border: 1.5px solid var(--color-surface-container-high);
          color: var(--color-text);
          font-family: var(--font-body);
          padding: 14px 18px;
          border-radius: 18px;
          outline: none;
          font-size: 15px;
          resize: none;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
        }

        .ta-input::placeholder {
          color: var(--color-text-muted);
          opacity: 0.75;
        }

        .ta-input:focus {
          border-color: var(--color-blush);
          box-shadow: 0 0 0 3px var(--tint-blush);
          background-color: var(--color-surface-container-lowest);
        }
      `}</style>
    </>
  )
}
