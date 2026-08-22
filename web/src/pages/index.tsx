import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'
import { AuthWelcome, LoginForm, SignupForm } from '../components/auth'

type AuthStep = 'welcome' | 'signup' | 'login'

export default function Onboarding() {
  const router = useRouter()
  const { user, token, login, signup, loginDemoUser } = useAuth()
  const [step, setStep] = useState<AuthStep>('welcome')
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

  const handleSignup = async (name: string, email: string, password: string) => {
    setError(null)
    setSubmitting(true)
    try {
      await signup(name, email, password)
      router.push('/timeline')
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
    setSubmitting(true)
    try {
      await login(email, password)
      router.push('/timeline')
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

  const changeStep = (nextStep: AuthStep) => {
    setError(null)
    setStep(nextStep)
  }

  return (
    <div className="onboarding-container">
      <Head>
        <title>Hangout - Your group's shared memory, together</title>
      </Head>

      <div className="card-container">
        {step !== 'welcome' && (
          <button className="back-btn" onClick={() => changeStep('welcome')} aria-label="Go back">
            <ArrowLeft size={20} />
          </button>
        )}

        {step === 'welcome' && (
          <AuthWelcome
            onGoogleDemo={handleGoogleDemo}
            onSignUp={() => changeStep('signup')}
            onLogIn={() => changeStep('login')}
            loading={submitting}
          />
        )}

        {step === 'signup' && (
          <SignupForm
            onSubmit={handleSignup}
            onGoogleDemo={handleGoogleDemo}
            onSwitchToLogin={() => changeStep('login')}
            error={error}
            submitting={submitting}
          />
        )}

        {step === 'login' && (
          <LoginForm
            onSubmit={handleLogin}
            onGoogleDemo={handleGoogleDemo}
            onSwitchToSignup={() => changeStep('signup')}
            error={error}
            submitting={submitting}
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
      `}</style>
    </div>
  )
}
