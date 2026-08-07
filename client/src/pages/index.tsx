import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Sparkles, Mail, Lock, User as UserIcon, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'
import { Button, InlineAlert, PasswordInput, TextField } from '../components/ui'

type AuthStep = 'welcome' | 'signup' | 'login'

export default function Onboarding() {
  const router = useRouter()
  const { user, token, login, signup, loginDemoUser } = useAuth()
  const [step, setStep] = useState<AuthStep>('welcome')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user && token) {
      router.push('/timeline')
    }
  }, [user, token, router])

  const handleGoogleDemo = async () => {
    setError(null)
    setSubmitting(true)
    try {
      await loginDemoUser()
      router.push('/timeline')
    } catch (err: any) {
      setError(err?.message || 'Failed to authenticate demo user.')
    } finally {
      setSubmitting(false)
    }
  }

  // Simple password strength calculation
  const getPasswordStrength = () => {
    if (!password) return { label: 'Empty', color: 'var(--color-surface-container)', width: '0%' }
    if (password.length < 4) return { label: 'Weak', color: 'var(--color-blush)', width: '33%' }
    if (password.length < 8) return { label: 'Medium', color: 'var(--color-tangerine)', width: '66%' }
    return { label: 'Strong', color: 'var(--color-matcha)', width: '100%' }
  }

  const strength = getPasswordStrength()

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (step === 'signup') {
        await signup(name, email, password)
      } else if (step === 'login') {
        await login(email, password)
      }
      router.push('/timeline')
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError(err?.message || 'Authentication failed. Please check your credentials.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="onboarding-container">
      <Head>
        <title>Hangout - Your group's shared memory, together</title>
      </Head>

      <div className="card-container">
        {step !== 'welcome' && (
          <button className="back-btn" onClick={() => setStep('welcome')}>
            <ArrowLeft size={20} />
          </button>
        )}

        {step === 'welcome' && (
          <div className="welcome-flow">
            {/* Illustrated Hero */}
            <div className="hero-illustration">
              <svg viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="illustration-svg">
                {/* Sky Gradient */}
                <defs>
                  <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#e36888" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#f2d88f" stopOpacity="0.6" />
                  </linearGradient>
                </defs>
                <rect width="400" height="240" rx="20" fill="url(#skyGrad)" />

                {/* String Lights */}
                <path d="M-10,30 Q100,60 200,30 Q300,60 410,30" stroke="#ffd166" strokeWidth="2" strokeDasharray="1,6" />
                <circle cx="50" cy="42" r="5" fill="#ffd166" className="glow-light" />
                <circle cx="120" cy="45" r="5" fill="#ffd166" className="glow-light" />
                <circle cx="200" cy="30" r="5" fill="#ffd166" className="glow-light" />
                <circle cx="280" cy="45" r="5" fill="#ffd166" className="glow-light" />
                <circle cx="350" cy="42" r="5" fill="#ffd166" className="glow-light" />

                {/* Hills/Ground */}
                <path d="M-20,240 L-20,180 Q100,160 200,190 T420,170 L420,240 Z" fill="#9dbf9b" />
                <path d="M-20,240 L-20,200 Q150,170 300,210 T420,195 L420,240 Z" fill="#b4b534" opacity="0.6" />

                {/* Picnic Blanket */}
                <polygon points="120,210 280,210 320,240 80,240" fill="#fff" opacity="0.9" />
                <polygon points="120,210 280,210 320,240 80,240" fill="none" stroke="#e36888" strokeWidth="1.5" />

                {/* Friends sitting around */}
                {/* Person 1 (Left) */}
                <circle cx="130" cy="180" r="14" fill="#6698cc" />
                <rect x="115" y="194" width="30" height="35" rx="8" fill="#5587ba" />

                {/* Person 2 (Center) */}
                <circle cx="200" cy="170" r="15" fill="#ffdcc2" />
                <rect x="182" y="185" width="36" height="45" rx="10" fill="#e36888" />

                {/* Person 3 (Right) */}
                <circle cx="270" cy="175" r="14" fill="#f08c21" />
                <rect x="255" y="189" width="30" height="40" rx="8" fill="#285f90" />

                {/* Tiny Campfire in center front */}
                <path d="M190,230 L210,230 L200,215 Z" fill="#f08c21" />
                <path d="M195,230 L205,230 L200,220 Z" fill="#ffd166" />
                <line x1="185" y1="232" x2="215" y2="228" stroke="#564245" strokeWidth="3" />
                <line x1="190" y1="228" x2="210" y2="232" stroke="#564245" strokeWidth="3" />
              </svg>
            </div>

            {/* Wordmark and Tagline */}
            <div className="brand-header">
              <h1>Hangout</h1>
              <p className="tagline">Your group's shared memory, together.</p>
            </div>

            {/* Action Buttons */}
            <div className="button-stack">
              <Button onClick={handleGoogleDemo}>
                <Sparkles size={18} />
                Continue with Google
              </Button>

              <Button variant="outline" onClick={() => setStep('signup')}>
                Sign up with Email
              </Button>
            </div>

            <div className="footer-link">
              Already have an account? <span onClick={() => setStep('login')}>Log in</span>
            </div>

            {/* Page Indicators */}
            <div className="carousel-indicators">
              <span className="dot active"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}

        {step === 'signup' && (
          <form className="auth-form" onSubmit={handleAuthSubmit}>
            <div className="form-icon-header">
              <div className="icon-badge">
                <Sparkles size={28} className="sparkle-icon" />
              </div>
              <h2>Create Account</h2>
              <p>Start a new memory space for your friends</p>
            </div>

            {error && <InlineAlert>{error}</InlineAlert>}

            <TextField
              label="Username"
              icon={<UserIcon size={16} />}
              required
              placeholder="e.g. mika"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <TextField
              label="Email Address"
              icon={<Mail size={16} />}
              type="email"
              required
              placeholder="mika@example.com"
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
            >
              {password && (
                <div className="strength-meter">
                  <div className="strength-bar" style={{ width: strength.width, backgroundColor: strength.color }}></div>
                  <span className="strength-label">Password strength: {strength.label}</span>
                </div>
              )}
            </PasswordInput>

            <Button type="submit" disabled={submitting} fullWidth>
              {submitting ? 'Creating Account...' : 'Create Account'}
            </Button>

            <div className="form-divider">
              <span>or</span>
            </div>

            <Button variant="outline" fullWidth onClick={handleGoogleDemo}>
              <Sparkles size={18} />
              Continue with Google
            </Button>

            <div className="footer-link">
              Already have an account? <span onClick={() => { setError(null); setStep('login'); }}>Log in</span>
            </div>
          </form>
        )}

        {step === 'login' && (
          <form className="auth-form" onSubmit={handleAuthSubmit}>
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
              placeholder="mika or mika@example.com"
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
              {submitting ? 'Logging In...' : 'Log In'}
            </Button>

            <div className="form-divider">
              <span>or</span>
            </div>

            <Button variant="outline" fullWidth onClick={handleGoogleDemo}>
              <Sparkles size={18} />
              Continue with Google
            </Button>

            <div className="footer-link">
              Don't have an account yet? <span onClick={() => { setError(null); setStep('signup'); }}>Sign up</span>
            </div>
          </form>
        )}
      </div>

      <style jsx>{`
        .onboarding-container {
          min-height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--color-background);
          padding: 24px;
        }

        .card-container {
          background-color: var(--color-surface-container-lowest);
          border-radius: 28px;
          box-shadow: var(--shadow-ambient);
          padding: 32px;
          width: 100%;
          max-width: 440px;
          min-height: 520px;
          position: relative;
          display: flex;
          flex-direction: column;
          border: 1px solid var(--color-surface-container-high);
        }

        .back-btn {
          position: absolute;
          top: 24px;
          left: 24px;
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: color 0.2s;
        }

        .back-btn:hover {
          color: var(--color-text);
        }

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

        .illustration-svg {
          width: 100%;
          border-radius: 20px;
          box-shadow: 0 8px 24px rgba(46, 42, 40, 0.08);
        }

        .brand-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .brand-header h1 {
          font-size: 38px;
          color: var(--color-blush);
          font-family: var(--font-display);
        }

        .tagline {
          font-size: 16px;
          color: var(--color-text-muted);
          margin-top: 8px;
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

        /* Form styling */
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

        .sparkle-icon {
          color: var(--color-tangerine);
        }

        .lock-icon {
          color: var(--color-blush);
        }

        .form-icon-header h2 {
          font-size: 24px;
        }

        .form-icon-header p {
          color: var(--color-text-muted);
          font-size: 14px;
          margin-top: 4px;
        }

        .strength-meter {
          margin-top: 6px;
        }

        .strength-bar {
          height: 6px;
          border-radius: 3px;
          transition: width 0.3s, background-color 0.3s;
        }

        .strength-label {
          font-size: 11px;
          color: var(--color-text-muted);
          margin-top: 4px;
          display: block;
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

        .glow-light {
          animation: glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
