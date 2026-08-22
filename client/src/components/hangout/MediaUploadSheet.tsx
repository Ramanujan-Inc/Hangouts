import React, { useState, useRef, useEffect } from 'react'
import { UploadCloud, Image as ImageIcon, Video, X, Plus, Lock, Globe } from 'lucide-react'
import { BottomSheet, Button, TextField } from '../ui'
import { formatBytes } from '../../lib/format'

interface SelectedMediaFile {
  id: string
  file: File
  previewUrl: string
  isVideo: boolean
  caption: string
}

export interface UploadMediaItem {
  file: File
  caption?: string
}

interface MediaUploadSheetProps {
  isOpen: boolean
  isUploading?: boolean
  onClose: () => void
  onUpload: (items: UploadMediaItem[], isShared?: boolean) => Promise<void>
}

export const MediaUploadSheet: React.FC<MediaUploadSheetProps> = ({
  isOpen,
  isUploading = false,
  onClose,
  onUpload,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<SelectedMediaFile[]>([])
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [isShared, setIsShared] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cleanup object URLs on unmount or file removal
  useEffect(() => {
    return () => {
      selectedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl))
    }
  }, [selectedFiles])

  if (!isOpen) return null

  const processFiles = (fileList: FileList | File[]) => {
    const validFiles: SelectedMediaFile[] = []
    let invalidCount = 0

    Array.from(fileList).forEach((file) => {
      const isImg = file.type.startsWith('image/')
      const isVid = file.type.startsWith('video/')

      if (!isImg && !isVid) {
        invalidCount++
        return
      }

      validFiles.push({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        isVideo: isVid,
        caption: '',
      })
    })

    if (invalidCount > 0) {
      setErrorMsg(`${invalidCount} file(s) were skipped because they are not photos or videos.`)
    } else {
      setErrorMsg('')
    }

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => {
        const next = [...prev, ...validFiles]
        return next
      })
    }
  }

  const handleRemoveFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedFiles((prev) => {
      const removeIndex = prev.findIndex((f) => f.id === id)
      const target = prev[removeIndex]
      if (target) URL.revokeObjectURL(target.previewUrl)
      const filtered = prev.filter((f) => f.id !== id)
      if (activeIndex >= filtered.length) {
        setActiveIndex(Math.max(0, filtered.length - 1))
      }
      return filtered
    })
  }

  const handleCaptionChange = (val: string) => {
    if (selectedFiles.length === 0 || activeIndex < 0 || activeIndex >= selectedFiles.length) return
    setSelectedFiles((prev) =>
      prev.map((item, idx) => (idx === activeIndex ? { ...item, caption: val } : item))
    )
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedFiles.length === 0) return
    try {
      const itemsToUpload: UploadMediaItem[] = selectedFiles.map((item) => ({
        file: item.file,
        caption: item.caption.trim() || undefined,
      }))
      await onUpload(itemsToUpload, isShared)
      handleClose()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload media.')
    }
  }

  const handleClose = () => {
    selectedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl))
    setSelectedFiles([])
    setActiveIndex(0)
    setIsShared(true)
    setErrorMsg('')
    onClose()
  }

  const totalBytes = selectedFiles.reduce((sum, item) => sum + item.file.size, 0)
  const currentActiveFile = selectedFiles[activeIndex] || null

  return (
    <BottomSheet onClose={handleClose}>
      <div className="upload-sheet-content">
        <div className="sheet-header-row">
          <div>
            <h3>Add Media to Gallery</h3>
            <p className="sheet-subtitle">Upload photos or video clips from this hangout:</p>
          </div>
          {selectedFiles.length > 0 && (
            <span className="file-count-badge">
              {selectedFiles.length} item{selectedFiles.length === 1 ? '' : 's'} ({formatBytes(totalBytes)})
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="upload-form">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*,video/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                processFiles(e.target.files)
                e.target.value = ''
              }
            }}
          />

          {selectedFiles.length === 0 ? (
            <div
              className={`dropzone-box ${isDragging ? 'dragging' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              <div className="dropzone-icon">
                <UploadCloud size={36} />
              </div>
              <span className="dropzone-title">Drag & drop photo or video</span>
              <span className="dropzone-subtitle">or click to browse from device</span>
            </div>
          ) : (
            <div className="bulk-preview-wrapper">
              <div className="preview-grid">
                {selectedFiles.map((item, idx) => {
                  const isActive = idx === activeIndex

                  return (
                    <div
                      key={item.id}
                      className={`preview-card ${isActive ? 'active' : ''}`}
                      onClick={() => setActiveIndex(idx)}
                      role="button"
                      tabIndex={0}
                    >
                      {item.isVideo ? (
                        <div className="preview-thumb-video">
                          <video src={item.previewUrl} className="thumb-media" />
                          <div className="video-indicator-pill">
                            <Video size={11} />
                          </div>
                        </div>
                      ) : (
                        <img src={item.previewUrl} alt={item.file.name} className="thumb-media" />
                      )}

                      <button
                        type="button"
                        className="remove-thumb-btn"
                        onClick={(e) => handleRemoveFile(item.id, e)}
                        title="Remove file"
                        aria-label="Remove file"
                      >
                        <X size={12} />
                      </button>

                      <div className="thumb-info-bar">
                        <span className="thumb-name">{item.file.name}</span>
                      </div>
                    </div>
                  )
                })}

                {/* Add More Tile */}
                <button
                  type="button"
                  className="add-more-tile"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus size={20} />
                  <span>Add more</span>
                </button>
              </div>
            </div>
          )}

          {errorMsg && <p className="error-text">{errorMsg}</p>}

          <TextField
            label="Caption (Optional)"
            placeholder="e.g. Best ramen in town!"
            value={currentActiveFile ? currentActiveFile.caption : ''}
            onChange={(e) => handleCaptionChange(e.target.value)}
          />

          <div className="privacy-toggle-row">
            <span className="privacy-lbl">Visibility:</span>
            <div className="privacy-buttons">
              <button
                type="button"
                className={`privacy-btn ${isShared ? 'active' : ''}`}
                onClick={() => setIsShared(true)}
              >
                <Globe size={14} />
                <span>Shared with Group</span>
              </button>
              <button
                type="button"
                className={`privacy-btn ${!isShared ? 'active' : ''}`}
                onClick={() => setIsShared(false)}
              >
                <Lock size={14} />
                <span>Private to Me</span>
              </button>
            </div>
          </div>

          <div className="sheet-btn-row">
            <Button variant="outline" type="button" onClick={handleClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={selectedFiles.length === 0 || isUploading}>
              {isUploading
                ? 'Uploading...'
                : selectedFiles.length > 1
                ? `Upload ${selectedFiles.length} Items`
                : 'Upload Media'}
            </Button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .upload-sheet-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .sheet-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
        }

        h3 {
          font-size: 20px;
          margin: 0 0 2px 0;
          color: var(--color-text);
        }

        .sheet-subtitle {
          color: var(--color-text-muted);
          font-size: 14px;
          margin: 0;
        }

        .file-count-badge {
          background-color: var(--tint-blush);
          color: var(--color-blush);
          font-size: 12px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 9999px;
          white-space: nowrap;
        }

        .upload-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .dropzone-box {
          height: 160px;
          border-radius: 16px;
          border: 2px dashed var(--color-outline-variant);
          background-color: var(--color-surface-container-low);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .dropzone-box:hover,
        .dropzone-box.dragging {
          border-color: var(--color-blush);
          background-color: var(--color-surface-container);
        }

        .dropzone-icon {
          color: var(--color-blush);
          margin-bottom: 2px;
        }

        .dropzone-title {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 14px;
          color: var(--color-text);
        }

        .dropzone-subtitle {
          font-size: 12px;
          color: var(--color-text-muted);
        }

        .bulk-preview-wrapper {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          gap: 10px;
          max-height: 240px;
          overflow-y: auto;
          padding: 4px;
        }

        .preview-card {
          position: relative;
          height: 100px;
          border-radius: 12px;
          overflow: hidden;
          background: #1e1e1e;
          border: 2px solid var(--color-surface-container-high);
          cursor: pointer;
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
        }

        .preview-card:hover {
          transform: translateY(-2px);
        }

        .preview-card.active {
          border-color: var(--color-blush);
          box-shadow: 0 0 0 2px var(--tint-blush), 0 4px 12px rgba(227, 104, 136, 0.25);
          transform: scale(1.03);
        }

        .thumb-media {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .preview-thumb-video {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .video-indicator-pill {
          position: absolute;
          top: 6px;
          left: 6px;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          padding: 2px 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
        }

        .remove-thumb-btn {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.65);
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s;
          z-index: 2;
        }

        .remove-thumb-btn:hover {
          background: #ff4757;
        }

        .thumb-info-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
          padding: 4px 6px;
        }

        .thumb-name {
          font-size: 10px;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: block;
        }

        .add-more-tile {
          height: 100px;
          border-radius: 12px;
          border: 2px dashed var(--color-outline-variant);
          background: var(--color-surface-container-low);
          color: var(--color-text-muted);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
        }

        .add-more-tile:hover {
          border-color: var(--color-blush);
          color: var(--color-blush);
          background: var(--color-surface-container);
        }

        .error-text {
          color: #ff6b6b;
          font-size: 13px;
          margin: 0;
        }

        .privacy-toggle-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .privacy-lbl {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 13px;
          color: var(--color-text);
        }

        .privacy-buttons {
          display: flex;
          gap: 8px;
        }

        .privacy-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 10px;
          border: 1px solid var(--color-surface-container-high);
          background: var(--color-surface-container-low);
          color: var(--color-text-muted);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }

        .privacy-btn.active {
          background: var(--color-surface-container);
          border-color: var(--color-blush);
          color: var(--color-blush);
          font-weight: 700;
        }

        .sheet-btn-row {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 6px;
        }
      `}</style>
    </BottomSheet>
  )
}
