import React from 'react'
import { X } from 'lucide-react'

export type BadgeVariant = 'blush' | 'sea' | 'matcha' | 'tangerine' | 'butter' | 'neutral' | 'surface'
export type BadgeSize = 'sm' | 'md' | 'lg'

export interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  icon?: React.ReactNode
  dot?: boolean
  onRemove?: () => void
  onClick?: () => void
  className?: string
  style?: React.CSSProperties
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  dot = false,
  onRemove,
  onClick,
  className = '',
  style,
}) => {
  const isClickable = Boolean(onClick)

  return (
    <span
      className={`badge badge-${variant} badge-${size} ${isClickable ? 'badge-clickable' : ''} ${className}`}
      style={style}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {dot && <span className="badge-dot" />}
      {icon && <span className="badge-icon">{icon}</span>}
      <span className="badge-content">{children}</span>
      {onRemove && (
        <button
          type="button"
          className="badge-remove-btn"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          aria-label="Remove badge"
        >
          <X size={12} />
        </button>
      )}

      <style jsx>{`
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 9999px;
          font-family: var(--font-display);
          font-weight: 700;
          line-height: 1;
          white-space: nowrap;
          transition: all 0.2s ease;
          user-select: none;
        }

        /* Sizes */
        .badge-sm {
          padding: 3px 8px;
          font-size: 11px;
        }

        .badge-md {
          padding: 4px 12px;
          font-size: 13px;
        }

        .badge-lg {
          padding: 6px 16px;
          font-size: 14px;
        }

        /* Variants */
        .badge-blush {
          background-color: var(--tint-blush);
          color: var(--color-blush);
          border: 1px solid rgba(227, 104, 136, 0.2);
        }

        .badge-sea {
          background-color: var(--tint-sea);
          color: var(--color-sea);
          border: 1px solid rgba(102, 152, 204, 0.2);
        }

        .badge-butter {
          background-color: var(--tint-butter);
          color: #947118;
          border: 1px solid rgba(242, 216, 143, 0.4);
        }

        .badge-matcha {
          background-color: #f1f6e4;
          color: #636b13;
          border: 1px solid rgba(180, 181, 52, 0.25);
        }

        .badge-tangerine {
          background-color: #fef0e4;
          color: var(--color-tangerine);
          border: 1px solid rgba(240, 140, 33, 0.25);
        }

        .badge-neutral {
          background-color: var(--color-surface-container);
          color: var(--color-text-muted);
          border: 1px solid var(--color-surface-container-high);
        }

        .badge-surface {
          background-color: var(--color-surface-container-lowest);
          color: var(--color-text);
          border: 1px solid var(--color-surface-container-high);
          box-shadow: 0 2px 4px rgba(46, 42, 40, 0.04);
        }

        /* Dot indicator */
        .badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: currentColor;
        }

        .badge-icon {
          display: inline-flex;
          align-items: center;
        }

        /* Clickable state */
        .badge-clickable {
          cursor: pointer;
        }

        .badge-clickable:hover {
          filter: brightness(0.96);
          transform: translateY(-1px);
        }

        .badge-clickable:active {
          transform: translateY(0);
        }

        /* Remove Button */
        .badge-remove-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          padding: 0;
          margin-left: 2px;
          color: currentColor;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.15s;
        }

        .badge-remove-btn:hover {
          opacity: 1;
        }
      `}</style>
    </span>
  )
}

export default Badge
