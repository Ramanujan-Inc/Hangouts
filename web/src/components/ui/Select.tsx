import React from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  icon?: React.ReactNode
  wrapperClassName?: string
}

export default function Select({
  label,
  icon,
  wrapperClassName = '',
  className = '',
  children,
  ...props
}: SelectProps) {
  return (
    <>
      <div className={`select-group ${wrapperClassName}`}>
        {label && (
          <label className="field-label">
            {icon}
            {label}
          </label>
        )}
        <div className="select-container">
          <select className={`pill-input select-input ${className}`} {...props}>
            {children}
          </select>
          <div className="select-arrow-icon" aria-hidden="true">
            <ChevronDown size={16} />
          </div>
        </div>
      </div>
      <style jsx>{`
        .select-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
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

        .select-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .select-input {
          width: 100%;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          cursor: pointer;
          padding-right: 38px;
        }

        .select-arrow-icon {
          position: absolute;
          right: 14px;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
        }
      `}</style>
    </>
  )
}
