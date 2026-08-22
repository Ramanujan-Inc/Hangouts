import React from 'react'
import { Bell, Settings, ChevronRight } from 'lucide-react'
import { Card, Badge } from '../ui'

export const SettingsLinksCard: React.FC = () => {
  return (
    <Card variant="default" padding="none" className="settings-list-card">
      <div className="settings-row">
        <div className="settings-row-left">
          <div className="settings-icon-box note-blush">
            <Bell size={18} />
          </div>
          <div className="settings-text-box">
            <div className="settings-title">Notification Preferences</div>
            <div className="settings-desc">Mute chats and emails</div>
          </div>
        </div>
        <Badge variant="butter" size="sm">
          Coming Soon
        </Badge>
      </div>

      <div className="settings-divider" />

      <div className="settings-row">
        <div className="settings-row-left">
          <div className="settings-icon-box note-sea">
            <Settings size={18} />
          </div>
          <div className="settings-text-box">
            <div className="settings-title">App Theme</div>
            <div className="settings-desc">Nostalgic Scrapbook (Default)</div>
          </div>
        </div>
        <ChevronRight size={18} className="chevron-icon" />
      </div>

      <style jsx>{`
        :global(.settings-list-card) {
          margin-bottom: 24px;
          overflow: hidden;
        }

        .settings-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
        }

        .settings-row-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .settings-icon-box {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .note-blush {
          background-color: var(--tint-blush);
          color: var(--color-blush);
        }

        .note-sea {
          background-color: var(--tint-sea);
          color: var(--color-sea);
        }

        .settings-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--color-text);
        }

        .settings-desc {
          font-size: 12px;
          color: var(--color-text-muted);
          margin-top: 2px;
        }

        :global(.chevron-icon) {
          color: var(--color-text-muted);
          opacity: 0.6;
        }

        .settings-divider {
          height: 1px;
          background-color: var(--color-surface-container-high);
          margin: 0 20px;
        }
      `}</style>
    </Card>
  )
}
