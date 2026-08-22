import React from 'react'
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
      <div className="header-avatar">
        <Avatar src={userAvatar} alt={userName} size={52} />
      </div>

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
      `}</style>
    </header>
  )
}
