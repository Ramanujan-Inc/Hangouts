import React from 'react'
import { Plus, Film, Video, Heart, Play } from 'lucide-react'
import { Button, EmptyState, Badge } from '../ui'
import { HangoutMedia } from './types'

interface MediaGalleryTabProps {
  media: HangoutMedia[]
  currentUserId: string
  mediaFilter: 'all' | 'favorites' | 'videos'
  onSetFilter: (filter: 'all' | 'favorites' | 'videos') => void
  onOpenUploadMenu: () => void
  onSelectMedia: (media: HangoutMedia) => void
  onToggleFavorite: (mediaId: string, e?: React.MouseEvent) => void
}

export const MediaGalleryTab: React.FC<MediaGalleryTabProps> = ({
  media,
  currentUserId,
  mediaFilter,
  onSetFilter,
  onOpenUploadMenu,
  onSelectMedia,
  onToggleFavorite,
}) => {
  const filteredMedia = media
    .filter((item) => {
      if (mediaFilter === 'favorites') {
        return Boolean(item.is_favorited)
      }
      if (mediaFilter === 'videos') {
        return item.media_type === 'video'
      }
      return true
    })
    .sort((a, b) => (b.favorites_count || 0) - (a.favorites_count || 0))

  const favoritesCount = media.filter((m) => Boolean(m.is_favorited)).length
  const videosCount = media.filter((m) => m.media_type === 'video').length

  return (
    <div className="photos-tab">
      <div className="tab-section-header">
        <h3>Media Stack ({filteredMedia.length})</h3>
        <Button size="compact" onClick={onOpenUploadMenu}>
          <Plus size={16} /> Add Media
        </Button>
      </div>

      {/* Media Filter Pills */}
      <div className="media-filter-bar">
        <button
          className={`filter-pill-btn ${mediaFilter === 'all' ? 'active' : ''}`}
          onClick={() => onSetFilter('all')}
          type="button"
        >
          All ({media.length})
        </button>

        <button
          className={`filter-pill-btn ${mediaFilter === 'favorites' ? 'active' : ''}`}
          onClick={() => onSetFilter('favorites')}
          type="button"
        >
          <Heart size={14} fill={mediaFilter === 'favorites' ? '#ff6b6b' : 'none'} />
          Favorites ({favoritesCount})
        </button>

        <button
          className={`filter-pill-btn ${mediaFilter === 'videos' ? 'active' : ''}`}
          onClick={() => onSetFilter('videos')}
          type="button"
        >
          <Video size={14} />
          Videos ({videosCount})
        </button>
      </div>

      {filteredMedia.length === 0 ? (
        <EmptyState
          icon={<Film size={32} />}
          title={
            mediaFilter === 'favorites'
              ? 'No favorite media saved yet.'
              : 'No media uploaded yet. Drop a memory here!'
          }
        />
      ) : (
        <div className="masonry-gallery">
          {filteredMedia.map((item) => {
            const isFavorited = Boolean(item.is_favorited)

            return (
              <div
                key={item.id}
                className={`gallery-item span-${item.span || 1}`}
                onClick={() => onSelectMedia(item)}
                role="button"
                tabIndex={0}
              >
                {item.media_type === 'video' ? (
                  <div className="video-thumb-container">
                    <video
                      src={item.url}
                      poster={item.thumbnail_url}
                      className="media-asset"
                    />
                    <div className="play-overlay-badge">
                      <Play size={24} fill="white" color="white" />
                    </div>
                  </div>
                ) : (
                  <img src={item.url} alt={item.caption || 'Hangout memory'} className="media-asset" />
                )}

                {item.media_type === 'video' && (
                  <div className="video-type-tag">
                    <Badge variant="surface" size="sm" icon={<Video size={12} />}>
                      Video
                    </Badge>
                  </div>
                )}

                {!item.is_shared && (
                  <div className="private-type-tag">
                    <Badge variant="surface" size="sm">
                      🔒 Private
                    </Badge>
                  </div>
                )}

                <div
                  className="photo-likes-overlay"
                  onClick={(e) => onToggleFavorite(item.id, e)}
                  title="Favorite this memory"
                  role="button"
                  tabIndex={0}
                >
                  <Heart
                    size={14}
                    fill={isFavorited ? '#ff6b6b' : 'white'}
                    color={isFavorited ? '#ff6b6b' : 'white'}
                  />
                  <span>{item.favorites_count || 0}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <style jsx>{`
        .photos-tab {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .tab-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .tab-section-header h3 {
          font-size: 18px;
          margin: 0;
          color: var(--color-text);
        }

        .media-filter-bar {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .filter-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid var(--color-surface-container-high);
          background: var(--color-surface-container-lowest);
          color: var(--color-text-muted);
          cursor: pointer;
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 700;
          transition: all 0.2s;
        }

        .filter-pill-btn:hover {
          background-color: var(--color-surface-container-low);
          color: var(--color-text);
        }

        .filter-pill-btn.active {
          background-color: var(--color-blush);
          border-color: var(--color-blush);
          color: #fff;
        }

        .masonry-gallery {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 12px;
          grid-auto-flow: dense;
        }

        .gallery-item {
          border-radius: 16px;
          overflow: hidden;
          position: relative;
          cursor: pointer;
          background-color: var(--color-surface-container);
          aspect-ratio: 1;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .gallery-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(46, 42, 40, 0.12);
        }

        .gallery-item.span-2 {
          grid-column: span 2;
          aspect-ratio: 2 / 1;
        }

        .media-asset {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .video-thumb-container {
          position: relative;
          width: 100%;
          height: 100%;
          background: #000;
        }

        .play-overlay-badge {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.6);
          border-radius: 50%;
          padding: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .video-type-tag {
          position: absolute;
          bottom: 8px;
          left: 8px;
          z-index: 2;
        }

        .private-type-tag {
          position: absolute;
          top: 8px;
          right: 8px;
          z-index: 2;
        }

        .photo-likes-overlay {
          position: absolute;
          bottom: 8px;
          right: 8px;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          border-radius: 12px;
          padding: 3px 8px;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 700;
          color: white;
          z-index: 3;
        }
      `}</style>
    </div>
  )
}
