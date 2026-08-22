import React from 'react'

interface BottomSheetProps {
  onClose?: () => void
  children: React.ReactNode
}

export default function BottomSheet({ onClose, children }: BottomSheetProps) {
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-drag-bar" />
        {children}
      </div>
      <style jsx>{`
        .sheet-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.3);
          z-index: 2500;
        }

        .sheet {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background-color: var(--color-surface-container-lowest);
          border-radius: 24px 24px 0 0;
          padding: 24px;
          box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.1);
          z-index: 2501;
        }

        .sheet-drag-bar {
          width: 32px;
          height: 4px;
          background-color: var(--color-surface-container-high);
          border-radius: 2px;
          margin: 0 auto 16px auto;
        }
      `}</style>
    </>
  )
}
