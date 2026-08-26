import React from 'react'
import Link from 'next/link'
import { Avatar } from '../ui'

interface TimelineHeaderProps {
  userName: string
  userAvatar: string
  groupsCount: number
}

export const TimelineHeader: React.FC<TimelineHeaderProps> = ({
  userName,
  userAvatar,
  groupsCount,
}) => {
  return (
    <header className="timeline-header">
      <div className="header-greeting">
        <h2>Hello, {userName} 👋</h2>
        <p className="subtitle">
          {groupsCount > 0
            ? `${groupsCount} active group${groupsCount > 1 ? 's' : ''}`
            : 'Welcome to your hangout scrapbook'}
        </p>
      </div>
      <Link href="/profile" className="header-avatar-link" aria-label="Go to profile" title="View profile">
        <Avatar src={userAvatar} alt={userName} size={52} />
      </Link>

      <style jsx>{`
        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .header-greeting h2 {
          font-size: 28px;
          margin: 0;
          color: var(--color-text);
        }

        .subtitle {
          font-size: 14px;
          color: var(--color-text-muted);
          margin-top: 4px;
          margin-bottom: 0;
        }

        .header-avatar-link {
          display: inline-flex;
          border-radius: 9999px;
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .header-avatar-link:hover {
          transform: scale(1.08);
        }

        .header-avatar-link:active {
          transform: scale(0.95);
        }
      `}</style>
    </header>
  )
}
