import React, { useEffect } from 'react'
import { Check, AlertCircle, Info, X } from 'lucide-react'

export type ToastVariant = 'success' | 'error' | 'info'

export interface ToastProps {
  message: string
  isOpen: boolean
  onClose: () => void
  variant?: ToastVariant
  durationMs?: number
  className?: string
}

const Toast: React.FC<ToastProps> = ({
  message,
  isOpen,
  onClose,
  variant = 'success',
  durationMs = 3000,
  className = '',
}) => {
  useEffect(() => {
    if (!isOpen || durationMs <= 0) return

    const timer = setTimeout(() => {
      onClose()
    }, durationMs)

    return () => clearTimeout(timer)
  }, [isOpen, durationMs, onClose])

  if (!isOpen || !message) return null

  const getIcon = () => {
    switch (variant) {
      case 'error':
        return <AlertCircle size={18} />
      case 'info':
        return <Info size={18} />
      case 'success':
      default:
        return <Check size={18} />
    }
  }

  return (
    <div className={`toast-container ${className}`} role="status" aria-live="polite">
      <div className={`toast-pill toast-${variant}`}>
        <span className="toast-icon">{getIcon()}</span>
        <span className="toast-message">{message}</span>
        <button
          type="button"
          className="toast-close"
          onClick={onClose}
          aria-label="Close notification"
        >
          <X size={14} />
        </button>
      </div>

      <style jsx>{`
        .toast-container {
          position: fixed;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1100;
          pointer-events: none;
          animation: toastSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .toast-pill {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          border-radius: 9999px;
          color: white;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 14px;
          box-shadow: 0 12px 28px rgba(46, 42, 40, 0.2);
        }

        .toast-success {
          background-color: var(--color-text);
        }

        .toast-error {
          background-color: var(--color-blush);
        }

        .toast-info {
          background-color: var(--color-sea);
        }

        .toast-icon {
          display: inline-flex;
          align-items: center;
          flex-shrink: 0;
        }

        .toast-message {
          line-height: 1.3;
        }

        .toast-close {
          background: none;
          border: none;
          color: inherit;
          padding: 0;
          margin-left: 4px;
          cursor: pointer;
          opacity: 0.7;
          display: inline-flex;
          align-items: center;
          transition: opacity 0.15s;
        }

        .toast-close:hover {
          opacity: 1;
        }

        @keyframes toastSlideUp {
          from {
            transform: translate(-50%, 20px);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

export default Toast
