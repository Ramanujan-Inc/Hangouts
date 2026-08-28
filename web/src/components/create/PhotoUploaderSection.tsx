import React, { useRef, useState } from 'react'
import { Camera, Star, Trash2, Plus, Image as ImageIcon, Video } from 'lucide-react'
import { UploadedPhoto } from './types'

interface PhotoUploaderSectionProps {
  uploadedPhotos: UploadedPhoto[]
  selectedCoverIndex: number
  activePhotoIndex?: number
  onPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSelectCover: (index: number) => void
  onSelectActivePhoto?: (index: number) => void
  onRemovePhoto: (index: number, e: React.MouseEvent) => void
  onCaptionChange?: (index: number, caption: string) => void
}

export const PhotoUploaderSection: React.FC<PhotoUploaderSectionProps> = ({
  uploadedPhotos,
  selectedCoverIndex,
  activePhotoIndex,
  onPhotoSelect,
  onSelectCover,
  onSelectActivePhoto,
  onRemovePhoto,
  onCaptionChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [internalActiveIndex, setInternalActiveIndex] = useState(0)

  // Use controlled activePhotoIndex if provided, otherwise internal state
  const rawActiveIndex =
    activePhotoIndex !== undefined ? activePhotoIndex : internalActiveIndex
  const activeIndex =
    uploadedPhotos.length > 0
      ? Math.min(Math.max(0, rawActiveIndex), uploadedPhotos.length - 1)
      : -1

  const handleSetActive = (idx: number) => {
    if (onSelectActivePhoto) {
      onSelectActivePhoto(idx)
    } else {
      setInternalActiveIndex(idx)
    }
  }

  const activePhoto =
    activeIndex >= 0 && uploadedPhotos[activeIndex]
      ? uploadedPhotos[activeIndex]
      : null
  const activePhotoUrl = activePhoto?.thumbnailUrl || activePhoto?.previewUrl || ''
  const isCurrentActiveCover = activeIndex >= 0 && activeIndex === selectedCoverIndex

  return (
    <div className="cover-picker-section">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*,video/*"
        multiple
        onChange={onPhotoSelect}
        style={{ display: 'none' }}
      />

      <div
        className={`cover-picker-box ${uploadedPhotos.length > 0 ? 'has-cover' : ''}`}
        onClick={() => {
          if (uploadedPhotos.length === 0) {
            fileInputRef.current?.click()
          }
        }}
        style={{
          backgroundImage: activePhotoUrl ? `url(${activePhotoUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        role="region"
        aria-label="Media preview"
      >
        {uploadedPhotos.length === 0 ? (
          <div
            className="picker-empty-content"
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
          >
            <div className="camera-circle">
              <Camera size={24} />
            </div>
            <span className="upload-title">Upload pictures & videos</span>
            <p className="hint">Click or tap to upload media, and choose your cover photo</p>
          </div>
        ) : (
          <div className="picker-top-bar">
            {isCurrentActiveCover ? (
              <div className="cover-badge-pill is-active-cover">
                <Star size={13} fill="currentColor" />
                <span>Cover Photo</span>
              </div>
            ) : (
              <button
                type="button"
                className="set-cover-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectCover(activeIndex)
                }}
                title="Set this media's thumbnail as the Hangout cover"
              >
                <Star size={13} />
                <span>Set as Cover</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Uploaded Photos & Videos Strip */}
      {uploadedPhotos.length > 0 && (
        <div className="uploaded-strip-section">
          <div className="strip-header">
            <span className="strip-title">
              <ImageIcon size={14} /> Uploaded Media
            </span>
            <span className="strip-count">
              {uploadedPhotos.length} item{uploadedPhotos.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="photos-strip">
            {uploadedPhotos.map((photo, idx) => {
              const isActive = activeIndex === idx
              const isCover = selectedCoverIndex === idx
              const thumbSrc = photo.thumbnailUrl || photo.previewUrl

              return (
                <div
                  key={photo.id}
                  className={`photo-thumb-card ${isActive ? 'is-active' : ''} ${isCover ? 'is-cover' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSetActive(idx)
                  }}
                  title={
                    isCover
                      ? `Media #${idx + 1} (Cover Photo)`
                      : `Media #${idx + 1} (Click to preview & edit caption)`
                  }
                  role="button"
                  tabIndex={0}
                >
                  <img src={thumbSrc} alt={`Upload ${idx + 1}`} />

                  {photo.isVideo && (
                    <div className="video-badge" title="Video">
                      <Video size={10} />
                    </div>
                  )}

                  {isCover && (
                    <div className="cover-tag" title="Cover Photo">
                      <Star size={9} fill="white" />
                      <span>Cover</span>
                    </div>
                  )}

                  <button
                    type="button"
                    className="remove-photo-btn"
                    onClick={(e) => onRemovePhoto(idx, e)}
                    title="Remove media"
                    aria-label="Remove media"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )
            })}

            <div
              className="photo-thumb-card add-more-card"
              onClick={() => fileInputRef.current?.click()}
              title="Upload more photos or videos"
              role="button"
              tabIndex={0}
            >
              <Plus size={20} />
              <span>Add</span>
            </div>
          </div>

          {/* Caption Input for the Active Media */}
          {activeIndex >= 0 && uploadedPhotos[activeIndex] && onCaptionChange && (
            <div className="photo-caption-row">
              <input
                type="text"
                className="photo-caption-input"
                placeholder={`Add caption for media #${activeIndex + 1} (optional)...`}
                value={uploadedPhotos[activeIndex].caption || ''}
                onChange={(e) => onCaptionChange(activeIndex, e.target.value)}
              />
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .cover-picker-section {
          margin-bottom: 24px;
        }

        .cover-picker-box {
          height: 200px;
          border-radius: 20px;
          border: 2px dashed var(--color-outline-variant);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background-color: var(--color-surface-container-low);
          transition: all 0.2s ease;
        }

        .cover-picker-box.has-cover {
          border-style: solid;
          border-color: transparent;
        }

        .picker-empty-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 20px;
          text-align: center;
          cursor: pointer;
          width: 100%;
          height: 100%;
          justify-content: center;
        }

        .picker-empty-content:hover .camera-circle {
          transform: scale(1.08);
          background-color: var(--tint-blush);
        }

        .camera-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: var(--color-surface-container);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-blush);
          margin-bottom: 4px;
          transition: transform 0.2s ease, background-color 0.2s ease;
        }

        .upload-title {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 16px;
          color: var(--color-text);
        }

        .hint {
          font-size: 13px;
          color: var(--color-text-muted);
          max-width: 320px;
          margin: 0;
        }

        /* Top Overlay Bar */
        .picker-top-bar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          background: linear-gradient(to bottom, rgba(0, 0, 0, 0.5) 0%, transparent 100%);
          z-index: 2;
          pointer-events: none;
        }

        .cover-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 9999px;
          font-family: var(--font-display);
          font-size: 12px;
          font-weight: 700;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          user-select: none;
          pointer-events: auto;
        }

        .cover-badge-pill.is-active-cover {
          background-color: var(--color-blush);
          color: white;
          box-shadow: 0 2px 8px rgba(227, 104, 136, 0.4);
        }

        .set-cover-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 9999px;
          font-family: var(--font-display);
          font-size: 12px;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.88);
          color: var(--color-text);
          border: 1px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          cursor: pointer;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          transition: all 0.2s ease;
          pointer-events: auto;
        }

        .set-cover-btn:hover {
          background: #ffffff;
          color: var(--color-blush);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.22);
        }

        /* Uploaded Photos Strip */
        .uploaded-strip-section {
          margin-top: 14px;
        }

        .strip-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 12px;
          color: var(--color-text-muted);
          font-weight: 700;
        }

        .strip-title {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .photos-strip {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 6px;
        }

        .photo-thumb-card {
          width: 72px;
          height: 72px;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          flex-shrink: 0;
          cursor: pointer;
          border: 2px solid transparent;
          transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
          background-color: var(--color-surface-container);
        }

        .photo-thumb-card:hover {
          transform: scale(1.05);
        }

        .photo-thumb-card.is-active {
          border-color: var(--color-blush);
          box-shadow: 0 0 0 2px var(--tint-blush);
        }

        .photo-thumb-card.is-cover:not(.is-active) {
          border-color: rgba(227, 104, 136, 0.35);
        }

        .photo-thumb-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .video-badge {
          position: absolute;
          bottom: 4px;
          right: 4px;
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 2px 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 2;
        }

        .cover-tag {
          position: absolute;
          top: 4px;
          left: 4px;
          background-color: var(--color-blush);
          color: white;
          padding: 2px 5px;
          border-radius: 5px;
          font-size: 9px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 2px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
          z-index: 2;
        }

        .remove-photo-btn {
          position: absolute;
          top: 4px;
          right: 4px;
          background-color: rgba(0, 0, 0, 0.6);
          color: white;
          border: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.15s;
          z-index: 2;
        }

        .remove-photo-btn:hover {
          background-color: var(--color-blush);
        }

        .add-more-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 2px dashed var(--color-outline-variant);
          background-color: var(--color-surface-container-low);
          color: var(--color-text-muted);
          font-size: 11px;
          font-weight: 700;
          gap: 2px;
        }

        .add-more-card:hover {
          border-color: var(--color-blush);
          color: var(--color-blush);
        }

        .photo-caption-row {
          margin-top: 10px;
        }

        .photo-caption-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid var(--color-surface-container-high);
          background-color: var(--color-surface-container-lowest);
          color: var(--color-text);
          font-size: 13px;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
          box-sizing: border-box;
        }

        .photo-caption-input:focus {
          border-color: var(--color-blush);
          box-shadow: 0 0 0 3px var(--tint-blush);
          background-color: var(--color-surface-container-lowest);
        }

        .photo-caption-input::placeholder {
          color: var(--color-text-muted);
          opacity: 0.75;
          font-size: 13px;
        }
      `}</style>
    </div>
  )
}

