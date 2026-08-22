import React from 'react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  variant?: 'card' | 'plain'
}

export default function EmptyState({ icon, title, description, variant = 'plain' }: EmptyStateProps) {
  if (variant === 'plain') {
    return (
      <>
        <div className="empty-plain">
          {icon}
          <p>{title}</p>
        </div>
        <style jsx>{`
          .empty-plain {
            text-align: center;
            padding: 40px;
            color: var(--color-text-muted);
          }

          .empty-plain :global(svg) {
            margin-bottom: 12px;
            color: var(--color-butter);
          }
        `}</style>
      </>
    )
  }

  return (
    <>
      <div className="empty-card">
        <div className="empty-icon">{icon}</div>
        <h4>{title}</h4>
        {description && <p>{description}</p>}
      </div>
      <style jsx>{`
        .empty-card {
          text-align: center;
          padding: 48px;
          background-color: var(--color-surface-container-low);
          border-radius: 24px;
          border: 2px dashed var(--color-outline-variant);
          color: var(--color-text-muted);
        }

        .empty-icon {
          color: var(--color-butter);
          margin-bottom: 16px;
        }

        .empty-card h4 {
          margin-bottom: 8px;
          font-size: 18px;
        }
      `}</style>
    </>
  )
}
