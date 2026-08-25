import React, { useState } from 'react'
import { Bell, Moon, Sun, ChevronRight } from 'lucide-react'
import { Card, Badge } from '../ui'
import { useTheme } from '../../context/ThemeContext'
import { ThemePickerModal } from './ThemePickerModal'

export const SettingsLinksCard: React.FC = () => {
  const { theme, resolvedTheme } = useTheme()
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false)

  const getThemeLabel = () => {
    if (theme === 'light') return 'Scrapbook Light'
    if (theme === 'dark') return 'Midnight Dark'
    return `System Match (${resolvedTheme === 'dark' ? 'Dark' : 'Light'})`
  }

  const ThemeIcon = resolvedTheme === 'dark' ? Moon : Sun

  return (
    <>
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

        <div
          className="settings-row settings-row-interactive"
          onClick={() => setIsThemeModalOpen(true)}
          role="button"
          tabIndex={0}
        >
          <div className="settings-row-left">
            <div className="settings-icon-box note-sea">
              <ThemeIcon size={18} />
            </div>
            <div className="settings-text-box">
              <div className="settings-title">App Theme</div>
              <div className="settings-desc">{getThemeLabel()}</div>
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

          .settings-row-interactive {
            cursor: pointer;
            transition: background-color 0.2s ease;
          }

          .settings-row-interactive:hover {
            background-color: var(--color-surface-container-low);
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

      <ThemePickerModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />
    </>
  )
}
