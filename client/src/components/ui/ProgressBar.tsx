import React from 'react'

export type ProgressBarVariant = 'blush' | 'matcha' | 'sea' | 'tangerine' | 'butter'
export type ProgressBarSize = 'sm' | 'md' | 'lg'

export interface ProgressBarProps {
  value: number
  max?: number
  variant?: ProgressBarVariant
  size?: ProgressBarSize
  showLabel?: boolean
  label?: string
  className?: string
  style?: React.CSSProperties
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  variant = 'blush',
  size = 'md',
  showLabel = false,
  label,
  className = '',
  style,
}) => {
  const percentage = Math.min(100, Math.max(0, max > 0 ? (value / max) * 100 : 0))

  return (
    <div className={`progress-wrapper ${className}`} style={style}>
      {(showLabel || label) && (
        <div className="progress-header">
          {label && <span className="progress-label">{label}</span>}
          {showLabel && <span className="progress-percentage">{Math.round(percentage)}%</span>}
        </div>
      )}

      <div
        className={`progress-track progress-size-${size}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={`progress-fill progress-${variant}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <style jsx>{`
        .progress-wrapper {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text-muted);
        }

        .progress-track {
          width: 100%;
          background-color: var(--color-surface-container);
          border-radius: 9999px;
          overflow: hidden;
          position: relative;
        }

        .progress-size-sm {
          height: 6px;
        }

        .progress-size-md {
          height: 10px;
        }

        .progress-size-lg {
          height: 16px;
        }

        .progress-fill {
          height: 100%;
          border-radius: 9999px;
          transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .progress-blush {
          background-color: var(--color-blush);
        }

        .progress-matcha {
          background-color: var(--color-matcha);
        }

        .progress-sea {
          background-color: var(--color-sea);
        }

        .progress-tangerine {
          background-color: var(--color-tangerine);
        }

        .progress-butter {
          background-color: var(--color-butter);
        }
      `}</style>
    </div>
  )
}

export default ProgressBar
