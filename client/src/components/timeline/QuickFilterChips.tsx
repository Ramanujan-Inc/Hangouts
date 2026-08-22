import React from 'react'
import { QuickFilter } from './types'

interface QuickFilterChipsProps {
  activeQuickFilter: QuickFilter
  onSelectFilter: (filter: QuickFilter) => void
}

const quickFilterOptions: Array<{ label: QuickFilter; color: string }> = [
  { label: 'All', color: 'var(--color-blush)' },
  { label: 'Created by Me', color: 'var(--color-sea)' },
  { label: 'This Month', color: 'var(--color-tangerine)' },
  { label: 'Memories', color: 'var(--color-matcha)' },
]

export const QuickFilterChips: React.FC<QuickFilterChipsProps> = ({
  activeQuickFilter,
  onSelectFilter,
}) => {
  return (
    <div className="filters-section">
      <div className="filter-chips-row">
        {quickFilterOptions.map((opt) => (
          <button
            key={opt.label}
            className={`filter-chip ${activeQuickFilter === opt.label ? 'active' : ''}`}
            onClick={() => onSelectFilter(opt.label)}
            style={{ '--chip-color': opt.color } as React.CSSProperties}
            type="button"
          >
            <span className="chip-indicator" />
            <span className="chip-label">{opt.label}</span>
          </button>
        ))}
      </div>

      <style jsx>{`
        .filters-section {
          margin-bottom: 24px;
        }

        .filter-chips-row {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .filter-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 9999px;
          border: 1px solid var(--color-surface-container-high);
          background-color: var(--color-surface-container-lowest);
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 13px;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .filter-chip:hover {
          background-color: var(--color-surface-container-low);
          border-color: var(--chip-color);
          color: var(--color-text);
        }

        .filter-chip.active {
          background-color: var(--chip-color);
          border-color: var(--chip-color);
          color: white;
          box-shadow: 0 4px 12px rgba(46, 42, 40, 0.15);
        }

        .chip-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--chip-color);
          transition: background-color 0.2s;
        }

        .filter-chip.active .chip-indicator {
          background-color: white;
        }
      `}</style>
    </div>
  )
}
