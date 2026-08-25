import React from 'react'

interface ModalProps {
  onClose?: () => void
  title?: string
  children: React.ReactNode
}

export default function Modal({ onClose, title, children }: ModalProps) {
  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          {title && <h3>{title}</h3>}
          {children}
        </div>
      </div>
      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--modal-backdrop-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 20px;
        }

        .modal-content {
          background-color: var(--color-surface-container-lowest);
          border-radius: 28px;
          width: 100%;
          max-width: 440px;
          padding: 24px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          border: 1px solid var(--color-surface-container-high);
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-content h3 {
          font-size: 20px;
          margin-bottom: 16px;
        }
      `}</style>
    </>
  )
}
