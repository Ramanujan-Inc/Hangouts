import React, { useState, useEffect } from 'react'
import { Sparkles, Lock, User as UserIcon } from 'lucide-react'
import { Button, InlineAlert, PasswordInput, TextField } from '../ui'

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>
  onGoogleDemo: () => void
  onSwitchToSignup: () => void
  error: string | null
  submitting?: boolean
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onGoogleDemo,
  onSwitchToSignup,
  error,
  submitting = false,
}) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showColdStartNotice, setShowColdStartNotice] = useState(false)

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (submitting) {
      // Show notice only if login takes longer than 3 seconds (server waking from idle)
      timer = setTimeout(() => {
        setShowColdStartNotice(true)
      }, 3000)
    } else {
      setShowColdStartNotice(false)
    }
    return () => clearTimeout(timer)
  }, [submitting])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(email, password)
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="form-icon-header">
        <div className="icon-badge">
          <Lock size={28} className="lock-icon" />
        </div>
        <h2>Welcome Back</h2>
        <p>Access your group's memory archive</p>
      </div>

      {error && <InlineAlert>{error}</InlineAlert>}

      <TextField
        label="Username or Email"
        icon={<UserIcon size={16} />}
        required
        placeholder="mika"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <PasswordInput
        label="Password"
        icon={<Lock size={16} />}
        required
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button type="submit" disabled={submitting} fullWidth>
        {submitting
          ? showColdStartNotice
            ? 'Waking up server...'
            : 'Logging In...'
          : 'Log In'}
      </Button>

      <div className="form-divider">
        <span>or</span>
      </div>

      <Button variant="outline" fullWidth onClick={onGoogleDemo} type="button">
        <Sparkles size={18} />
        Continue with Google
      </Button>

      <div className="footer-link">
        Don't have an account yet? <span onClick={onSwitchToSignup}>Sign up</span>
      </div>

      {showColdStartNotice && (
        <div className="server-notice animate-fade-in">
          <span>⚡ Backend is waking up from idle mode (Render free tier). This may take up to ~45s...</span>
        </div>
      )}

      <style jsx>{`
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-top: 16px;
        }

        .form-icon-header {
          text-align: center;
          margin-bottom: 12px;
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

        .lock-icon {
          color: var(--color-blush);
        }

        .form-icon-header h2 {
          font-size: 24px;
          margin: 0;
        }

        .form-icon-header p {
          color: var(--color-text-muted);
          font-size: 14px;
          margin-top: 4px;
          margin-bottom: 0;
        }

        .form-divider {
          text-align: center;
          border-bottom: 1px dashed var(--color-outline-variant);
          line-height: 0.1em;
          margin: 10px 0;
        }

        .form-divider span {
          background: var(--color-surface-container-lowest);
          padding: 0 10px;
          color: var(--color-text-muted);
          font-size: 14px;
        }

        .footer-link {
          text-align: center;
          font-size: 14px;
          color: var(--color-text-muted);
        }

        .footer-link span {
          color: var(--color-sea);
          font-weight: 700;
          cursor: pointer;
        }

        .footer-link span:hover {
          text-decoration: underline;
        }

        .server-notice {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 4px;
          padding: 8px 14px;
          border-radius: 999px;
          background-color: var(--color-surface-container);
          color: var(--color-text-muted);
          font-size: 11.5px;
          line-height: 1.35;
          text-align: center;
          animation: fadeIn 0.3s ease-in-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </form>
  )
}
