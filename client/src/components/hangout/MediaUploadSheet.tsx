import React from 'react'
import { Video } from 'lucide-react'
import { BottomSheet, Button } from '../ui'
import { mockUploadOptions } from '../../data/mock'

interface MediaUploadSheetProps {
  isOpen: boolean
  onClose: () => void
  onMockUpload: (url: string, type?: 'photo' | 'video') => void
}

export const MediaUploadSheet: React.FC<MediaUploadSheetProps> = ({
  isOpen,
  onClose,
  onMockUpload,
}) => {
  if (!isOpen) return null

  return (
    <BottomSheet onClose={onClose}>
      <h3>Add Media to Gallery</h3>
      <p className="sheet-subtitle">Select a photo or video to upload:</p>

      <div className="sheet-options">
        {mockUploadOptions.map((opt) => (
          <div
            key={opt.url}
            className="sheet-option-card"
            onClick={() => onMockUpload(opt.url, 'photo')}
            role="button"
            tabIndex={0}
          >
            <img src={opt.url} alt={opt.label} />
            <span>📷 {opt.label}</span>
          </div>
        ))}
        <div
          className="sheet-option-card"
          onClick={() =>
            onMockUpload(
              'https://assets.mixkit.co/videos/preview/mixkit-chef-preparing-ramen-soup-42867-large.mp4',
              'video'
            )
          }
          role="button"
          tabIndex={0}
        >
          <div className="video-placeholder-box">
            <Video size={32} color="#ff6b6b" />
          </div>
          <span>🎥 Mock Ramen Video</span>
        </div>
      </div>

      <Button variant="outline" fullWidth onClick={onClose}>
        Cancel
      </Button>

      <style jsx>{`
        h3 {
          font-size: 20px;
          margin: 0 0 4px 0;
          color: var(--color-text);
        }

        .sheet-subtitle {
          color: var(--color-text-muted);
          font-size: 14px;
          margin-bottom: 16px;
        }

        .sheet-options {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }

        .sheet-option-card {
          border-radius: 12px;
          overflow: hidden;
          background-color: var(--color-surface-container-low);
          cursor: pointer;
          border: 1px solid var(--color-surface-container-high);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-bottom: 8px;
          text-align: center;
          transition: transform 0.15s;
        }

        .sheet-option-card:hover {
          transform: translateY(-2px);
          border-color: var(--color-blush);
        }

        .sheet-option-card img {
          width: 100%;
          height: 90px;
          object-fit: cover;
        }

        .video-placeholder-box {
          background: #222;
          height: 90px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sheet-option-card span {
          font-size: 12px;
          font-weight: 700;
          color: var(--color-text);
          margin-top: 6px;
          padding: 0 4px;
        }
      `}</style>
    </BottomSheet>
  )
}
