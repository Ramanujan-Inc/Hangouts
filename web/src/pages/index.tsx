import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'
import { AuthWelcome, LoginForm, SignupForm, VerificationPending } from '../components/auth'
import { Spinner } from '../components/ui'

type AuthStep = 'welcome' | 'signup' | 'login' | 'verification-pending'

export default function Onboarding() {
  const router = useRouter()
  const { user, token, login, signup, resendConfirmation, signInWithGoogle } = useAuth()
  const [step, setStep] = useState<AuthStep>('welcome')
  const [error, setError] = useState<string | null>(null)
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null)
  const [pendingEmail, setPendingEmail] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [googleSubmitting, setGoogleSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState<string | null>(null)
  const [showWakeupModal, setShowWakeupModal] = useState(false)

  const getRedirectUrl = () => {
    const redirect = router.query.redirect
    return (typeof redirect === 'string' && redirect.startsWith('/') && redirect !== '/') ? redirect : '/timeline'
  }

  // Check if server is reachable on website load; if sleeping on Render, freeze screen with modal
  useEffect(() => {
    let isMounted = true
    let pollTimer: NodeJS.Timeout
    let graceTimer: NodeJS.Timeout

    const checkHealth = async (): Promise<boolean> => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000)

      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
        const url = `${baseUrl.replace(/\/$/, '')}/health`
        const res = await fetch(url, { signal: controller.signal })
        clearTimeout(timeoutId)
        if (res.ok) {
          if (isMounted) setShowWakeupModal(false)
          return true
        } else {
          return false
        }
      } catch {
        return false
      }
    }

    const startHealthFlow = async () => {
      // 1.5s grace period: warm server finishes in <1.5s so modal never flashes
      graceTimer = setTimeout(() => {
        if (isMounted) setShowWakeupModal(true)
      }, 1500)

      const isUp = await checkHealth()
      clearTimeout(graceTimer)

      if (isUp) {
        if (isMounted) setShowWakeupModal(false)
      } else {
        if (isMounted) setShowWakeupModal(true)
        // Poll every 3 seconds until server wakes up
        pollTimer = setInterval(async () => {
          const healthy = await checkHealth()
          if (healthy && isMounted) {
            setShowWakeupModal(false)
            clearInterval(pollTimer)
          }
        }, 3000)
      }
    }

    startHealthFlow()

    return () => {
      isMounted = false
      if (graceTimer) clearTimeout(graceTimer)
      if (pollTimer) clearInterval(pollTimer)
    }
  }, [])

  useEffect(() => {
    if (user && token) {
      router.push(getRedirectUrl())
    }
  }, [user, token, router])

  // Handle feedback parameters from callback redirects (e.g. ?error=... or ?confirmed=true)
  useEffect(() => {
    if (router.query.error && typeof router.query.error === 'string') {
      setError(router.query.error)
      setStep('login')
    }
    if (router.query.confirmed === 'true' || router.query.verified === 'true') {
      setConfirmationNotice('Your email has been verified successfully! You can now log in.')
      setStep('login')
    }
  }, [router.query])

  const handleGoogleSignIn = async () => {
    setError(null)
    setConfirmationNotice(null)
    setGoogleSubmitting(true)
    try {
      await signInWithGoogle(getRedirectUrl())
    } catch (err: any) {
      setError(err?.message || 'Failed to initiate Google sign in. Please try again.')
      setGoogleSubmitting(false)
    }
  }

  const handleSignup = async (name: string, email: string, password: string) => {
    setError(null)
    setConfirmationNotice(null)
    setSubmitting(true)
    try {
      const res = await signup(name, email, password)
      if (res.access_token) {
        router.push(getRedirectUrl())
      } else {
        setPendingEmail(email)
        setResendSuccess(null)
        setStep('verification-pending')
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError(err?.message || 'Failed to create account.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogin = async (email: string, password: string) => {
    setError(null)
    setConfirmationNotice(null)
    setSubmitting(true)
    try {
      await login(email, password)
      router.push(getRedirectUrl())
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError(err?.message || 'Incorrect username or password.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleResendConfirmation = async (targetEmail: string) => {
    if (!targetEmail) return
    setResending(true)
    setResendSuccess(null)
    setError(null)
    try {
      await resendConfirmation(targetEmail)
      setResendSuccess('Verification email sent! Please check your inbox.')
    } catch (err: any) {
      setError(err?.message || 'Failed to resend confirmation email.')
    } finally {
      setResending(false)
    }
  }

  const changeStep = (nextStep: AuthStep) => {
    setError(null)
    setConfirmationNotice(null)
    setResendSuccess(null)
    setStep(nextStep)
  }

  return (
    <div className="onboarding-container">
      <Head>
        <title>Hangout - Your group's shared memory, together</title>
      </Head>

      <div className="onboarding-flow-wrapper">
        <div className={`card-container ${step === 'verification-pending' ? 'card-compact' : ''}`}>
          {step !== 'welcome' && (
            <button className="back-btn" onClick={() => changeStep('welcome')} aria-label="Go back">
              <ArrowLeft size={20} />
            </button>
          )}

          {step === 'welcome' && (
            <AuthWelcome
              onGoogleSignIn={handleGoogleSignIn}
              onSignUp={() => changeStep('signup')}
              onLogIn={() => changeStep('login')}
              loading={googleSubmitting || submitting}
              error={error}
            />
          )}

          {step === 'signup' && (
            <SignupForm
              onSubmit={handleSignup}
              onGoogleSignIn={handleGoogleSignIn}
              onSwitchToLogin={() => changeStep('login')}
              error={error}
              submitting={submitting}
              googleSubmitting={googleSubmitting}
            />
          )}

          {step === 'login' && (
            <>
              {confirmationNotice && (
                <div className="confirmation-notice">
                  {confirmationNotice}
                </div>
              )}
              <LoginForm
                onSubmit={handleLogin}
                onGoogleSignIn={handleGoogleSignIn}
                onSwitchToSignup={() => changeStep('signup')}
                error={error}
                submitting={submitting}
                googleSubmitting={googleSubmitting}
                onResendConfirmation={handleResendConfirmation}
                resendingConfirmation={resending}
              />
            </>
          )}

          {step === 'verification-pending' && (
            <VerificationPending
              email={pendingEmail}
              onResend={() => handleResendConfirmation(pendingEmail)}
              onBackToLogin={() => changeStep('login')}
              resending={resending}
              resendSuccess={resendSuccess}
              error={error}
            />
          )}
        </div>
      </div>

      {showWakeupModal && (
        <div className="wakeup-backdrop animate-fade-in">
          <div className="wakeup-modal">
            <div className="wakeup-icon-wrapper">
              <Spinner size={32} />
            </div>
            <h3>Waking up the server...</h3>
            <p className="wakeup-description">
              The backend is spinning up from idle mode (Render free tier). This typically takes ~30–45 seconds. Hang tight, we'll let you in automatically as soon as it's ready!
            </p>
            <div className="wakeup-status-pill">
              <span className="pulse-indicator" />
              <span>Connecting to backend...</span>
            </div>
          </div>
        </div>
      )}

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
          transition: min-height 0.25s ease;
        }

        .card-container.card-compact {
          min-height: auto;
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
          z-index: 10;
        }

        .back-btn:hover {
          color: var(--color-text);
        }

        .confirmation-notice {
          background: rgba(34, 197, 94, 0.12);
          border: 1px solid rgba(34, 197, 94, 0.4);
          color: #16a34a;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-size: 0.875rem;
          text-align: center;
          margin-bottom: 1rem;
        }

        .onboarding-flow-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 440px;
        }

        .wakeup-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(20, 18, 16, 0.45);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 24px;
        }

        .wakeup-modal {
          background-color: var(--color-surface-container-lowest);
          border-radius: 28px;
          padding: 36px 28px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
          border: 1px solid var(--color-surface-container-high);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 16px;
        }

        .wakeup-icon-wrapper {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: var(--color-surface-container);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wakeup-modal h3 {
          font-size: 20px;
          margin: 0;
          color: var(--color-text);
          font-weight: 700;
        }

        .wakeup-description {
          font-size: 13.5px;
          color: var(--color-text-muted);
          line-height: 1.5;
          margin: 0;
        }

        .wakeup-status-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 999px;
          background-color: var(--color-surface-container);
          color: var(--color-text-muted);
          font-size: 12px;
          font-weight: 500;
          margin-top: 4px;
        }

        .pulse-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #f59e0b;
          animation: pulse 1.6s infinite;
          flex-shrink: 0;
        }

        @keyframes pulse {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.6);
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 6px rgba(245, 158, 11, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(245, 158, 11, 0);
          }
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
    </div>
  )
}
