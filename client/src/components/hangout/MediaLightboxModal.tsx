import React from 'react'
import { X, Heart, Trash2 } from 'lucide-react'
import MemberAvatar from '../MemberAvatar'
import { members } from '../../data/mock'
import { HangoutMedia } from './types'

interface MediaLightboxModalProps {
  activeMedia: HangoutMedia | null
  currentUserId: string
  onClose: () => void
  onToggleFavorite: (mediaId: string) => void
  onDeleteMedia: (mediaId: string) => void
}

export const MediaLightboxModal: React.FC<MediaLightboxModalProps> = ({
  activeMedia,
  currentUserId,
  onClose,
  onToggleFavorite,
  onDeleteMedia,
}) => {
  if (!activeMedia) return null

  const isFavorited = (activeMedia.favoritedBy || []).includes(currentUserId)
  const isUploader = activeMedia.uploadedBy === currentUserId

  return (
    <div className="lightbox-backdrop" role="dialog" aria-modal="true">
      <button
        className="lightbox-close"
        onClick={onClose}
        type="button"
        aria-label="Close media viewer"
      >
        <X size={24} />
      </button>

      <div className="lightbox-container">
        {activeMedia.mediaType === 'video' ? (
          <video
            src={activeMedia.url}
            controls
            autoPlay
            className="lightbox-img"
          />
        ) : (
          <img src={activeMedia.url} alt="Lightbox View" className="lightbox-img" />
        )}

        {/* Top Info Bar */}
        <div className="lightbox-top-bar">
          <MemberAvatar memberId={activeMedia.uploadedBy} size={32} />
          <div>
            <div className="light-author">
              Uploaded by {members[activeMedia.uploadedBy]?.name || activeMedia.uploadedBy}
            </div>
            <div className="light-time">
              {activeMedia.mediaType === 'video' ? 'Video' : 'Photo'}
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="lightbox-bottom-bar">
          <button
            className="light-action-btn"
            onClick={() => onToggleFavorite(activeMedia.id)}
            type="button"
          >
            <Heart
              size={20}
              fill={isFavorited ? '#ff6b6b' : 'transparent'}
              color={isFavorited ? '#ff6b6b' : 'white'}
            />
            <span>
              {activeMedia.likes} {activeMedia.likes === 1 ? 'Favorite' : 'Favorites'}
            </span>
          </button>

          {isUploader && (
            <button
              className="light-action-btn delete-btn"
              onClick={() => onDeleteMedia(activeMedia.id)}
              type="button"
            >
              <Trash2 size={20} />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .lightbox-backdrop {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(10px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.2s ease;
        }

        .lightbox-close {
          position: absolute;
          top: 24px;
          right: 24px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.2s;
          z-index: 2010;
        }

        .lightbox-close:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        .lightbox-container {
          position: relative;
          max-width: 90vw;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .lightbox-img {
          max-width: 90vw;
          max-height: 75vh;
          object-fit: contain;
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        }

        .lightbox-top-bar {
          position: absolute;
          top: 16px;
          left: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          padding: 8px 14px;
          border-radius: 9999px;
          color: white;
        }

        .light-author {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 13px;
        }

        .light-time {
          font-size: 11px;
          opacity: 0.7;
        }

        .lightbox-bottom-bar {
          margin-top: 16px;
          display: flex;
          gap: 12px;
        }

        .light-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .light-action-btn:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        .delete-btn:hover {
          background: var(--color-blush);
          border-color: var(--color-blush);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
