import React, { useState, useEffect } from 'react'
import { Mail, RefreshCw } from 'lucide-react'
import { Button, InlineAlert } from '../ui'

interface VerificationPendingProps {
  email: string
  onResend: () => Promise<void>
  onBackToLogin?: () => void
  resending?: boolean
  resendSuccess?: string | null
  error?: string | null
}

export const VerificationPending: React.FC<VerificationPendingProps> = ({
  email,
  onResend,
  resending = false,
  resendSuccess = null,
  error = null,
}) => {
  const [countdown, setCountdown] = useState<number>(60)

  useEffect(() => {
    if (countdown <= 0) return

    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [countdown])

  const handleResend = async () => {
    if (countdown > 0 || resending) return
    try {
      await onResend()
      setCountdown(60)
    } catch {
      // Keep a small 15s cooldown even on failure to prevent instant spamming
      setCountdown(15)
    }
  }

  return (
    <div className="verification-container">
      <div className="form-icon-header">
        <div className="icon-badge">
          <Mail size={32} className="mail-icon" />
        </div>
        <h2>Check Your Email</h2>
        <p>
          We sent a verification link to{' '}
          <strong className="target-email">{email || 'your email address'}</strong>
        </p>
      </div>

      {resendSuccess && (
        <div className="success-banner">
          {resendSuccess}
        </div>
      )}

      {error && <InlineAlert>{error}</InlineAlert>}

      <div className="verification-card">
        <p className="instruction">
          Please click the confirmation link in the email to activate your account. If you don't see it in a few moments, check your spam or junk folder.
        </p>
      </div>

      <Button
        variant="outline"
        fullWidth
        onClick={handleResend}
        disabled={resending || countdown > 0}
        type="button"
      >
        <RefreshCw size={16} className={resending ? 'spinning' : ''} />
        {resending
          ? 'Resending verification email...'
          : countdown > 0
          ? `Resend email in ${countdown}s`
          : 'Resend verification email'}
      </Button>

      <style jsx>{`
        .verification-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-top: 16px;
        }

        .form-icon-header {
          text-align: center;
          margin-bottom: 8px;
        }

        .icon-badge {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background-color: var(--color-surface-container);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px auto;
        }

        .mail-icon {
          color: var(--color-sea);
        }

        .form-icon-header h2 {
          font-size: 24px;
          margin: 0;
        }

        .form-icon-header p {
          color: var(--color-text-muted);
          font-size: 14px;
          margin-top: 6px;
          margin-bottom: 0;
          word-break: break-all;
        }

        .target-email {
          color: var(--color-text);
          font-weight: 600;
        }

        .verification-card {
          background-color: var(--color-surface-container-low);
          border-radius: 16px;
          padding: 16px;
          border: 1px dashed var(--color-outline-variant);
        }

        .instruction {
          margin: 0;
          font-size: 13.5px;
          line-height: 1.5;
          color: var(--color-text-muted);
          text-align: center;
        }

        .success-banner {
          background: rgba(34, 197, 94, 0.12);
          border: 1px solid rgba(34, 197, 94, 0.4);
          color: #16a34a;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-size: 0.875rem;
          text-align: center;
        }

        :global(.spinning) {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
