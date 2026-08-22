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
          background-color: var(--color-surface-container-low);
          border: 2px solid transparent;
          color: var(--color-text);
          font-family: var(--font-body);
          padding: 12px 16px;
          border-radius: 18px;
          outline: none;
          font-size: 16px;
          resize: none;
          transition: border-color 0.2s, background-color 0.2s;
        }

        .ta-input:focus {
          border-color: var(--color-blush);
          background-color: var(--color-surface-container-lowest);
        }
      `}</style>
    </>
  )
}
