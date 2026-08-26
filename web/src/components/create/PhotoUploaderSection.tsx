import React, { useRef } from 'react'
import { Camera, Star, Trash2, Plus, Image as ImageIcon } from 'lucide-react'
import { Badge } from '../ui'
import { UploadedPhoto } from './types'

interface PhotoUploaderSectionProps {
  uploadedPhotos: UploadedPhoto[]
  selectedCoverIndex: number
  onPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSelectCover: (index: number) => void
  onRemovePhoto: (index: number, e: React.MouseEvent) => void
  onCaptionChange?: (index: number, caption: string) => void
}

export const PhotoUploaderSection: React.FC<PhotoUploaderSectionProps> = ({
  uploadedPhotos,
  selectedCoverIndex,
  onPhotoSelect,
  onSelectCover,
  onRemovePhoto,
  onCaptionChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeCoverUrl =
    selectedCoverIndex >= 0 && uploadedPhotos[selectedCoverIndex]
      ? uploadedPhotos[selectedCoverIndex].previewUrl
      : ''

  return (
    <div className="cover-picker-section">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        multiple
        onChange={onPhotoSelect}
        style={{ display: 'none' }}
      />

      <div
        className={`cover-picker-box ${uploadedPhotos.length > 0 ? 'has-cover' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        style={{
          backgroundImage: activeCoverUrl ? `url(${activeCoverUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        role="button"
        tabIndex={0}
      >
        {uploadedPhotos.length === 0 ? (
          <div className="picker-empty-content">
            <div className="camera-circle">
              <Camera size={24} />
            </div>
            <span className="upload-title">Upload pictures</span>
            <p className="hint">Click or tap to upload pictures, and choose your cover photo</p>
          </div>
        ) : (
          <div className="picker-overlay">
            <Badge variant="surface" size="sm" icon={<Star size={14} fill="currentColor" />}>
              Cover Photo #{selectedCoverIndex + 1} (Tap to upload more)
            </Badge>
          </div>
        )}
      </div>

      {/* Uploaded Photos Strip & Cover Selector */}
      {uploadedPhotos.length > 0 && (
        <div className="uploaded-strip-section">
          <div className="strip-header">
            <span className="strip-title">
              <ImageIcon size={14} /> Uploaded Pictures (Tap to set as Cover Photo)
            </span>
            <span className="strip-count">
              {uploadedPhotos.length} photo{uploadedPhotos.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="photos-strip">
            {uploadedPhotos.map((photo, idx) => {
              const isCover = selectedCoverIndex === idx
              return (
                <div
                  key={photo.id}
                  className={`photo-thumb-card ${isCover ? 'is-cover' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectCover(idx)
                  }}
                  title={isCover ? 'Active Cover Photo' : 'Click to make this the cover photo'}
                  role="button"
                  tabIndex={0}
                >
                  <img src={photo.previewUrl} alt={`Upload ${idx + 1}`} />

                  {isCover && (
                    <div className="cover-tag">
                      <Star size={10} fill="white" />
                      <span>Cover</span>
                    </div>
                  )}

                  <button
                    type="button"
                    className="remove-photo-btn"
                    onClick={(e) => onRemovePhoto(idx, e)}
                    title="Remove picture"
                    aria-label="Remove picture"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )
            })}

            <div
              className="photo-thumb-card add-more-card"
              onClick={() => fileInputRef.current?.click()}
              title="Upload more photos"
              role="button"
              tabIndex={0}
            >
              <Plus size={20} />
              <span>Add</span>
            </div>
          </div>

          {/* Caption Input for Selected Picture */}
          {selectedCoverIndex >= 0 && uploadedPhotos[selectedCoverIndex] && onCaptionChange && (
            <div className="photo-caption-row">
              <input
                type="text"
                className="photo-caption-input"
                placeholder={`Add caption for photo #${selectedCoverIndex + 1} (optional)...`}
                value={uploadedPhotos[selectedCoverIndex].caption || ''}
                onChange={(e) => onCaptionChange(selectedCoverIndex, e.target.value)}
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
          height: 180px;
          border-radius: 20px;
          border: 2px dashed var(--color-outline-variant);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          background-color: var(--color-surface-container-low);
          position: relative;
          overflow: hidden;
        }

        .cover-picker-box:hover {
          border-color: var(--color-blush);
          background-color: var(--color-surface-container);
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

        .picker-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.4), transparent);
          display: flex;
          align-items: flex-end;
          padding: 16px;
        }

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
          transition: transform 0.15s, border-color 0.15s;
          background-color: var(--color-surface-container);
        }

        .photo-thumb-card:hover {
          transform: scale(1.05);
        }

        .photo-thumb-card.is-cover {
          border-color: var(--color-blush);
          box-shadow: 0 0 0 2px var(--tint-blush);
        }

        .photo-thumb-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .cover-tag {
          position: absolute;
          top: 4px;
          left: 4px;
          background-color: var(--color-blush);
          color: white;
          padding: 2px 6px;
          border-radius: 6px;
          font-size: 9px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 2px;
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
