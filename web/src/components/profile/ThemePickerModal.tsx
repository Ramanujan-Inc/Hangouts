import React from 'react'
import { Sun, Moon, Laptop, Check, X } from 'lucide-react'
import { useTheme, Theme } from '../../context/ThemeContext'
import { Modal } from '../ui'

interface ThemePickerModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ThemeOption {
  id: Theme
  title: string
  desc: string
  icon: React.ReactNode
  iconBgClass: string
  iconColor: string
}

export const ThemePickerModal: React.FC<ThemePickerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { theme, setTheme } = useTheme()

  if (!isOpen) return null

  const options: ThemeOption[] = [
    {
      id: 'light',
      title: 'Scrapbook Light',
      desc: 'Warm cream paper aesthetic with sunny pastels',
      icon: <Sun size={20} />,
      iconBgClass: 'theme-icon-butter',
      iconColor: 'var(--color-tangerine)',
    },
    {
      id: 'dark',
      title: 'Midnight Dark',
      desc: 'Deep warm espresso night with glowing accents',
      icon: <Moon size={20} />,
      iconBgClass: 'theme-icon-sea',
      iconColor: 'var(--color-blush)',
    },
    {
      id: 'system',
      title: 'System Match',
      desc: 'Automatically syncs with your device settings',
      icon: <Laptop size={20} />,
      iconBgClass: 'theme-icon-blush',
      iconColor: 'var(--color-sea)',
    },
  ]

  const handleSelect = (selectedId: Theme) => {
    setTheme(selectedId)
  }

  return (
    <Modal onClose={onClose}>
      <div className="theme-modal-inner">
        <div className="theme-modal-header">
          <h3 className="theme-modal-title">Choose App Theme</h3>
          <button
            type="button"
            className="theme-close-btn"
            onClick={onClose}
            aria-label="Close theme picker"
          >
            <X size={18} />
          </button>
        </div>

        <p className="theme-modal-subtitle">
          Select your preferred scrapbook vibe. Changes apply instantly across the whole app.
        </p>

        <div className="theme-options-list">
          {options.map((opt) => {
            const isSelected = theme === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                className={`theme-option-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(opt.id)}
              >
                <div className={`theme-option-icon ${opt.iconBgClass}`} style={{ color: opt.iconColor }}>
                  {opt.icon}
                </div>
                <div className="theme-option-info">
                  <div className="theme-option-title-row">
                    <span className="theme-option-title">{opt.title}</span>
                    {isSelected && (
                      <span className="theme-check-badge">
                        <Check size={14} />
                      </span>
                    )}
                  </div>
                  <div className="theme-option-desc">{opt.desc}</div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="theme-modal-footer">
          <button type="button" className="pill-button pill-button-primary full-width" onClick={onClose}>
            Done
          </button>
        </div>
      </div>

      <style jsx>{`
        .theme-modal-inner {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .theme-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .theme-modal-title {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 700;
          color: var(--color-text);
          margin: 0;
        }

        .theme-close-btn {
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }

        .theme-close-btn:hover {
          background-color: var(--color-surface-container-high);
          color: var(--color-text);
        }

        .theme-modal-subtitle {
          font-size: 13px;
          color: var(--color-text-muted);
          line-height: 1.4;
          margin: 0;
        }

        .theme-options-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 6px;
        }

        .theme-option-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 18px;
          background-color: var(--color-surface-container-low);
          border: 2px solid transparent;
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .theme-option-card:hover {
          background-color: var(--color-surface-container);
          transform: translateY(-1px);
        }

        .theme-option-card.selected {
          border-color: var(--color-blush);
          background-color: var(--color-surface-container-lowest);
          box-shadow: 0 4px 14px rgba(227, 104, 136, 0.15);
        }

        .theme-option-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .theme-icon-butter {
          background-color: var(--tint-butter);
        }

        .theme-icon-sea {
          background-color: var(--tint-sea);
        }

        .theme-icon-blush {
          background-color: var(--tint-blush);
        }

        .theme-option-info {
          flex: 1;
          min-width: 0;
        }

        .theme-option-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .theme-option-title {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 700;
          color: var(--color-text);
        }

        .theme-check-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: var(--color-blush);
          color: white;
        }

        .theme-option-desc {
          font-size: 12px;
          color: var(--color-text-muted);
          margin-top: 2px;
        }

        .theme-modal-footer {
          margin-top: 10px;
        }
      `}</style>
    </Modal>
  )
}
