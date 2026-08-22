import React from 'react'

interface InlineAlertProps {
  children: React.ReactNode
}

export default function InlineAlert({ children }: InlineAlertProps) {
  return (
    <>
      <div className="inline-alert">{children}</div>
      <style jsx>{`
        .inline-alert {
          background: var(--tint-blush);
          border: 1px solid var(--color-blush);
          color: var(--color-blush);
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-size: 0.875rem;
          margin-bottom: 1rem;
          text-align: center;
        }
      `}</style>
    </>
  )
}
