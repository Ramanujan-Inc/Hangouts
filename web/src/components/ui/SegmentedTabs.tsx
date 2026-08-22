import React from 'react'

export interface SegmentedTab {
  id: string
  label: string
  icon?: React.ReactNode
}

interface SegmentedTabsProps {
  tabs: SegmentedTab[]
  active: string
  onChange: (id: string) => void
}

export default function SegmentedTabs({ tabs, active, onChange }: SegmentedTabsProps) {
  return (
    <>
      <div className="segmented-tab-bar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${active === tab.id ? 'active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.icon}
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>
      <style jsx>{`
        .segmented-tab-bar {
          background-color: var(--color-surface-container);
          padding: 6px;
          border-radius: 9999px;
          display: flex;
          gap: 4px;
          box-shadow: var(--shadow-inner);
        }

        .tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 9999px;
          border: none;
          background: transparent;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 14px;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tab-btn.active {
          background-color: var(--color-blush);
          color: white;
          box-shadow: 0 4px 10px rgba(227, 104, 136, 0.2);
        }

        @media (max-width: 650px) {
          .segmented-tab-bar {
            flex-wrap: wrap;
          }

          .tab-label {
            display: none;
          }

          .tab-btn {
            padding: 8px;
          }
        }
      `}</style>
    </>
  )
}
