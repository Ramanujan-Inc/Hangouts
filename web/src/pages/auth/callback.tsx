import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../../components/ui'

export default function AuthCallback() {
  const router = useRouter()
  const { setAuthToken } = useAuth()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const hash = window.location.hash
    const query = router.query

    // Target redirect destination (defaults to /timeline)
    const nextParam = query.next || query.redirect
    const nextPath = typeof nextParam === 'string' && nextParam.startsWith('/') ? nextParam : '/timeline'

    // Extract params from hash or search query
    const hashContent = hash.replace(/^#/, '')
    const searchContent = window.location.search.replace(/^\?/, '')
    const hashParams = new URLSearchParams(hashContent)
    const searchParams = new URLSearchParams(searchContent)

    // 1. Check for error description in hash or query
    const errorDesc = hashParams.get('error_description') || searchParams.get('error_description')
    if (errorDesc) {
      const message = decodeURIComponent(errorDesc.replace(/\+/g, ' '))
      setErrorMessage(message)
      router.replace(`/?error=${encodeURIComponent(message)}`)
      return
    }

    // 2. Check for access_token in hash or query
    const accessToken = hashParams.get('access_token') || searchParams.get('access_token')
    if (accessToken) {
      setAuthToken(accessToken)
        .then(() => {
          router.replace(nextPath)
        })
        .catch((err) => {
          console.error('Failed to establish session in callback:', err)
          const msg = 'Verification succeeded, but could not load profile. Please log in.'
          router.replace(`/?error=${encodeURIComponent(msg)}`)
        })
      return
    }

    // 3. Fallback if no token found and router is ready
    if (router.isReady && !hash && !searchParams.get('code')) {
      router.replace('/')
    }
  }, [router.isReady, router.query, setAuthToken, router])

  return (
    <div className="callback-container">
      <Head>
        <title>Hangout - Confirming your session...</title>
      </Head>

      <div className="callback-card">
        <Spinner size={36} />
        <h2>{errorMessage ? 'Verification Error' : 'Confirming your account...'}</h2>
        <p>{errorMessage || 'Completing sign in and preparing your memory space...'}</p>
      </div>

      <style jsx>{`
        .callback-container {
          min-height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--color-background);
          padding: 24px;
        }

        .callback-card {
          background-color: var(--color-surface-container-lowest);
          border-radius: 24px;
          box-shadow: var(--shadow-ambient);
          padding: 40px 32px;
          width: 100%;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          border: 1px solid var(--color-surface-container-high);
          gap: 16px;
        }

        h2 {
          font-size: 20px;
          margin: 0;
          color: var(--color-text);
        }

        p {
          font-size: 14px;
          color: var(--color-text-muted);
          margin: 0;
          line-height: 1.5;
        }
      `}</style>
    </div>
  )
}
