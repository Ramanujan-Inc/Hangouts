import React from 'react'
import { HardDrive } from 'lucide-react'
import { Card, Badge, ProgressBar } from '../ui'
import { formatBytes } from '../../lib/format'
import { StorageUsage } from './types'

interface StorageUsageCardProps {
  storageUsage: StorageUsage | null
  loading: boolean
}

export const StorageUsageCard: React.FC<StorageUsageCardProps> = ({
  storageUsage,
  loading,
}) => {
  const percentage = Math.min(Math.max(storageUsage?.percentage_used ?? 0, 0), 100)

  const getProgressVariant = () => {
    if (percentage > 90) return 'blush'
    if (percentage > 75) return 'tangerine'
    return 'matcha'
  }

  const getBadgeVariant = () => {
    if (percentage > 90) return 'blush'
    if (percentage > 75) return 'tangerine'
    return 'matcha'
  }

  return (
    <Card variant="default" padding="md" className="storage-card">
      <div className="storage-card-header">
        <div className="storage-header-left">
          <div className="storage-icon-box">
            <HardDrive size={18} />
          </div>
          <div className="storage-text-block">
            <div className="storage-title">Storage Usage</div>
            <div className="storage-subtitle">
              {loading ? (
                'Loading quota...'
              ) : (
                <>
                  <strong>{formatBytes(storageUsage?.used_bytes ?? 0)}</strong> of{' '}
                  {formatBytes(storageUsage?.max_bytes ?? 500 * 1024 * 1024)} used
                </>
              )}
            </div>
          </div>
        </div>

        {!loading && (
          <Badge variant={getBadgeVariant()} size="sm">
            {storageUsage ? `${storageUsage.percentage_used}%` : '0%'}
          </Badge>
        )}
      </div>

      <div className="storage-meter-container">
        <ProgressBar
          value={percentage}
          max={100}
          variant={getProgressVariant()}
          size="md"
        />
      </div>

      <div className="storage-card-footer">
        <p>Uploaded photos and videos in your hangouts count towards your 500 MB quota.</p>
      </div>

      <style jsx>{`
        :global(.storage-card) {
          margin-bottom: 24px;
        }

        .storage-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }

        .storage-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .storage-icon-box {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background-color: var(--tint-blush);
          color: var(--color-blush);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .storage-title {
          font-weight: 700;
          font-size: 15px;
          color: var(--color-text);
        }

        .storage-subtitle {
          font-size: 13px;
          color: var(--color-text-muted);
          margin-top: 2px;
        }

        .storage-meter-container {
          margin-bottom: 12px;
        }

        .storage-card-footer p {
          font-size: 12px;
          color: var(--color-text-muted);
          margin: 0;
          line-height: 1.4;
        }
      `}</style>
    </Card>
  )
}
