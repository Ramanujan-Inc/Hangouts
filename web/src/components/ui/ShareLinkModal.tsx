import React, { useState } from 'react'
import { Copy, Check, Share2, Link as LinkIcon } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

interface ShareLinkModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  shareUrl: string
}

export default function ShareLinkModal({
  isOpen,
  onClose,
  title,
  subtitle,
  shareUrl,
}: ShareLinkModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          url: shareUrl,
        })
      } catch (err) {
        // User aborted share or share failed
      }
    }
  }

  const hasNativeShare = typeof navigator !== 'undefined' && Boolean(navigator.share)

  return (
    <Modal title={title} onClose={onClose}>
      <div className="share-modal-container">
        {subtitle && <p className="share-subtitle">{subtitle}</p>}

        <div className="link-box-row">
          <div className="link-input-wrapper">
            <LinkIcon size={16} className="link-icon" />
            <input
              type="text"
              readOnly
              value={shareUrl}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="share-link-input"
              aria-label="Shareable invite link"
            />
          </div>
          <Button
            size="default"
            variant={copied ? 'secondary' : 'primary'}
            onClick={handleCopy}
            type="button"
          >
            {copied ? (
              <>
                <Check size={16} />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Copy</span>
              </>
            )}
          </Button>
        </div>

        <p className="share-hint">
          Anyone with this link will be able to view details and join.
        </p>

        {hasNativeShare && (
          <div className="native-share-action">
            <Button
              variant="outline"
              size="default"
              fullWidth
              onClick={handleNativeShare}
              type="button"
            >
              <Share2 size={16} />
              <span>Share via...</span>
            </Button>
          </div>
        )}
      </div>

      <style jsx>{`
        .share-modal-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .share-subtitle {
          font-size: 14px;
          color: var(--color-text-muted);
          margin: 0;
        }

        .link-box-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .link-input-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: var(--color-surface-container-low);
          border: 1px solid var(--color-surface-container-high);
          border-radius: 12px;
          padding: 8px 12px;
          overflow: hidden;
        }

        :global(.link-icon) {
          color: var(--color-text-muted);
          flex-shrink: 0;
        }

        .share-link-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: 13px;
          color: var(--color-text);
          font-family: inherit;
          width: 100%;
        }

        .share-hint {
          font-size: 12px;
          color: var(--color-text-muted);
          margin: 0;
        }

        .native-share-action {
          margin-top: 4px;
        }
      `}</style>
    </Modal>
  )
}
