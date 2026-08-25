import React from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '../ui'
import { useTheme } from '../../context/ThemeContext'

interface AuthWelcomeProps {
  onGoogleDemo: () => void
  onSignUp: () => void
  onLogIn: () => void
  loading?: boolean
}

export const AuthWelcome: React.FC<AuthWelcomeProps> = ({
  onGoogleDemo,
  onSignUp,
  onLogIn,
  loading = false,
}) => {
  const { resolvedTheme } = useTheme()
  const heroImageSrc = resolvedTheme === 'dark' ? '/images/auth-hero-night.svg' : '/images/auth-hero-day.svg'

  return (
    <div className="welcome-flow">
      <div className="hero-illustration">
        <img
          src={heroImageSrc}
          alt="Hangout friends together"
          className="illustration-img"
        />
      </div>

      <div className="brand-header">
        <h1>Hangout</h1>
        <p className="tagline">Your group's shared memory, together.</p>
      </div>

      <div className="button-stack">
        <Button onClick={onGoogleDemo} disabled={loading} fullWidth>
          <Sparkles size={18} />
          Continue with Google
        </Button>

        <Button variant="outline" onClick={onSignUp} disabled={loading} fullWidth>
          Sign up with Email
        </Button>
      </div>

      <div className="footer-link">
        Already have an account? <span onClick={onLogIn}>Log in</span>
      </div>

      <div className="carousel-indicators">
        <span className="dot active" />
        <span className="dot" />
        <span className="dot" />
      </div>

      <style jsx>{`
        .welcome-flow {
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          justify-content: space-between;
          flex: 1;
        }

        .hero-illustration {
          width: 100%;
          margin-bottom: 24px;
        }

        .illustration-img {
          width: 100%;
          height: auto;
          border-radius: 20px;
          box-shadow: 0 8px 24px rgba(46, 42, 40, 0.08);
          display: block;
        }

        .brand-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .brand-header h1 {
          font-size: 38px;
          color: var(--color-blush);
          font-family: var(--font-display);
          margin: 0;
        }

        .tagline {
          font-size: 16px;
          color: var(--color-text-muted);
          margin-top: 8px;
          margin-bottom: 0;
        }

        .button-stack {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
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

        .carousel-indicators {
          display: flex;
          gap: 8px;
          margin-top: 24px;
        }

        .carousel-indicators .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--color-surface-container-high);
        }

        .carousel-indicators .dot.active {
          background-color: var(--color-blush);
          width: 18px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  )
}
