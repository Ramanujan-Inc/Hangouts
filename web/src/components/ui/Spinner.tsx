import React from 'react'
import { Loader2 } from 'lucide-react'

export type SpinnerSize = 'sm' | 'md' | 'lg'

export interface SpinnerProps {
  size?: SpinnerSize | number
  color?: string
  label?: string
  centered?: boolean
  className?: string
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'var(--color-blush)',
  label,
  centered = false,
  className = '',
}) => {
  const getPixelSize = (): number => {
    if (typeof size === 'number') return size
    switch (size) {
      case 'sm':
        return 16
      case 'lg':
        return 32
      case 'md':
      default:
        return 22
    }
  }

  const px = getPixelSize()

  return (
    <div className={`spinner-wrapper ${centered ? 'spinner-centered' : ''} ${className}`}>
      <Loader2 size={px} color={color} className="spinner-icon" />
      {label && <span className="spinner-label">{label}</span>}

      <style jsx>{`
        .spinner-wrapper {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--color-text-muted);
          font-family: var(--font-body);
          font-size: 14px;
        }

        .spinner-centered {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 24px;
          width: 100%;
        }

        :global(.spinner-icon) {
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}

export default Spinner
