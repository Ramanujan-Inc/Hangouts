import React from 'react'

export type CardVariant = 'default' | 'low' | 'outline' | 'polaroid'
export type CardPadding = 'none' | 'sm' | 'md' | 'lg'

export interface CardProps {
  children: React.ReactNode
  variant?: CardVariant
  padding?: CardPadding
  hoverable?: boolean
  clickable?: boolean
  onClick?: () => void
  className?: string
  style?: React.CSSProperties
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  clickable = false,
  onClick,
  className = '',
  style,
}) => {
  const isInteractive = clickable || Boolean(onClick)

  return (
    <div
      className={`card card-${variant} card-pad-${padding} ${hoverable ? 'card-hoverable' : ''} ${
        isInteractive ? 'card-clickable' : ''
      } ${className}`}
      style={style}
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
    >
      {children}

      <style jsx>{`
        .card {
          border-radius: 24px;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease;
          position: relative;
          box-sizing: border-box;
        }

        /* Padding */
        .card-pad-none {
          padding: 0;
        }
        .card-pad-sm {
          padding: 12px 16px;
        }
        .card-pad-md {
          padding: 20px 24px;
        }
        .card-pad-lg {
          padding: 28px 32px;
        }

        /* Variants */
        .card-default {
          background-color: var(--color-surface-container-lowest);
          border: 1px solid var(--color-surface-container-high);
          box-shadow: var(--shadow-ambient);
        }

        .card-low {
          background-color: var(--color-surface-container-low);
          border: 1px solid var(--color-surface-container);
        }

        .card-outline {
          background-color: transparent;
          border: 2px dashed var(--color-outline-variant);
        }

        .card-polaroid {
          background-color: var(--color-surface-container-lowest);
          border-radius: 20px;
          padding: 14px 14px 20px 14px;
          box-shadow: var(--shadow-ambient);
          border: 1px solid var(--color-surface-container-high);
        }

        /* Interactions */
        .card-hoverable:hover {
          transform: translateY(-3px);
          box-shadow: 0 35px 45px -15px rgba(46, 42, 40, 0.12);
        }

        .card-clickable {
          cursor: pointer;
        }

        .card-clickable:active {
          transform: scale(0.985);
        }
      `}</style>
    </div>
  )
}

export default Card
