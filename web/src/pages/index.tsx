import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'
import { AuthWelcome, LoginForm, SignupForm, VerificationPending } from '../components/auth'

type AuthStep = 'welcome' | 'signup' | 'login' | 'verification-pending'

export default function Onboarding() {
  const router = useRouter()
  const { user, token, login, signup, resendConfirmation, signInWithGoogle } = useAuth()
  const [step, setStep] = useState<AuthStep>('welcome')
  const [error, setError] = useState<string | null>(null)
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null)
  const [pendingEmail, setPendingEmail] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState<string | null>(null)

  const getRedirectUrl = () => {
    const redirect = router.query.redirect
    return (typeof redirect === 'string' && redirect.startsWith('/')) ? redirect : '/timeline'
  }

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
    setSubmitting(true)
    try {
      await signInWithGoogle(getRedirectUrl())
    } catch (err: any) {
      setError(err?.message || 'Failed to initiate Google sign in.')
      setSubmitting(false)
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
            loading={submitting}
          />
        )}

        {step === 'signup' && (
          <SignupForm
            onSubmit={handleSignup}
            onGoogleSignIn={handleGoogleSignIn}
            onSwitchToLogin={() => changeStep('login')}
            error={error}
            submitting={submitting}
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
      `}</style>
    </div>
  )
}
