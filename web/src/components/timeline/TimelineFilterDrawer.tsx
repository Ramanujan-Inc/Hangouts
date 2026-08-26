import React from 'react'
import { SlidersHorizontal, RotateCcw } from 'lucide-react'
import { SearchInput, Badge, Card, Select } from '../ui'
import { Group } from './types'

interface TimelineFilterDrawerProps {
  searchQuery: string
  onSearchChange: (val: string) => void
  hangoutNameQuery: string
  onHangoutNameChange: (val: string) => void
  locationNameQuery: string
  onLocationNameChange: (val: string) => void
  dateQuery: string
  onDateChange: (val: string) => void
  groupNameQuery: string
  onGroupNameChange: (val: string) => void
  groupsList: Group[]
  activeFiltersCount: number
  showFilterDrawer: boolean
  onToggleFilterDrawer: () => void
  onResetFilters: () => void
  hasActiveFilters: boolean
}

export const TimelineFilterDrawer: React.FC<TimelineFilterDrawerProps> = ({
  searchQuery,
  onSearchChange,
  hangoutNameQuery,
  onHangoutNameChange,
  locationNameQuery,
  onLocationNameChange,
  dateQuery,
  onDateChange,
  groupNameQuery,
  onGroupNameChange,
  groupsList,
  activeFiltersCount,
  showFilterDrawer,
  onToggleFilterDrawer,
  onResetFilters,
  hasActiveFilters,
}) => {
  return (
    <div className="search-section">
      <div className="search-row">
        <div className="search-input-wrapper">
          <SearchInput
            placeholder="Search hangouts, places, notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <button
          className={`filter-toggle-btn ${showFilterDrawer || activeFiltersCount > 0 ? 'active' : ''}`}
          onClick={onToggleFilterDrawer}
          title="Toggle granular filter inputs"
          type="button"
        >
          <SlidersHorizontal size={18} />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <Badge variant="blush" size="sm">
              {activeFiltersCount}
            </Badge>
          )}
        </button>
      </div>

      {/* Granular Query Filters Drawer */}
      {showFilterDrawer && (
        <Card variant="low" padding="md" className="granular-filters-card">
          <div className="filters-grid">
            <div className="filter-field">
              <label>Hangout Name</label>
              <input
                type="text"
                className="pill-input"
                placeholder="e.g. Ramen Night"
                value={hangoutNameQuery}
                onChange={(e) => onHangoutNameChange(e.target.value)}
              />
            </div>

            <div className="filter-field">
              <label>Location</label>
              <input
                type="text"
                className="pill-input"
                placeholder="e.g. BGC or Cafe"
                value={locationNameQuery}
                onChange={(e) => onLocationNameChange(e.target.value)}
              />
            </div>

            <div className="filter-field">
              <label>Date</label>
              <input
                type="text"
                className="pill-input date-input"
                placeholder="e.g. 2026-08 or 2026"
                value={dateQuery}
                onChange={(e) => onDateChange(e.target.value)}
              />
            </div>

            <div className="filter-field">
              <Select
                label="Group"
                value={groupNameQuery}
                onChange={(e) => onGroupNameChange(e.target.value)}
              >
                <option value="">All Groups</option>
                {groupsList.map((grp) => (
                  <option key={grp.id} value={grp.name}>
                    {grp.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="filter-reset-row">
              <button className="reset-link" onClick={onResetFilters} type="button">
                <RotateCcw size={14} />
                <span>Clear all filters</span>
              </button>
            </div>
          )}
        </Card>
      )}

      <style jsx>{`
        .search-section {
          margin-bottom: 20px;
        }

        .search-row {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .search-input-wrapper {
          flex: 1;
        }

        .filter-toggle-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 18px;
          border-radius: 9999px;
          border: 1px solid var(--color-surface-container-high);
          background-color: var(--color-surface-container-lowest);
          color: var(--color-text);
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: var(--shadow-ambient);
          white-space: nowrap;
        }

        .filter-toggle-btn:hover,
        .filter-toggle-btn.active {
          border-color: var(--color-blush);
          background-color: var(--tint-blush);
          color: var(--color-blush);
        }

        :global(.granular-filters-card) {
          margin-top: 14px;
          animation: slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
        }

        .filter-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .filter-field label {
          font-family: var(--font-display);
          font-size: 12px;
          font-weight: 700;
          color: var(--color-text-muted);
        }

        .filter-reset-row {
          display: flex;
          justify-content: flex-end;
          margin-top: 14px;
          padding-top: 10px;
          border-top: 1px dashed var(--color-outline-variant);
        }

        .reset-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: var(--color-blush);
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 8px;
          transition: opacity 0.15s;
        }

        .reset-link:hover {
          opacity: 0.8;
          text-decoration: underline;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
