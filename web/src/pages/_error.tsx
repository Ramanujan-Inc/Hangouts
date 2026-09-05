import type { NextPageContext } from 'next'
import Head from 'next/head'
import Link from 'next/link'

interface ErrorProps {
  statusCode?: number
  message?: string
}

export default function ErrorPage({ statusCode, message }: ErrorProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: 'var(--color-background, #fbf3ec)',
        color: 'var(--color-text, #2e2a28)',
        textAlign: 'center',
        fontFamily: 'var(--font-body, sans-serif)',
      }}
    >
      <Head>
        <title>{statusCode ? `${statusCode} - Error` : 'Error'}</title>
      </Head>

      <div
        style={{
          maxWidth: '440px',
          width: '100%',
          backgroundColor: 'var(--color-surface-container-lowest, #ffffff)',
          borderRadius: '24px',
          padding: '40px 32px',
          boxShadow: 'var(--shadow-ambient, 0 30px 40px -15px rgba(46, 42, 40, 0.08))',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-display, sans-serif)',
            fontSize: '48px',
            margin: '0 0 12px',
            color: 'var(--color-blush, #e36888)',
            fontWeight: 700,
          }}
        >
          {statusCode || 'Oops'}
        </h1>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 600,
            margin: '0 0 12px',
          }}
        >
          {statusCode
            ? `An error ${statusCode} occurred on the server`
            : 'An unexpected client error occurred'}
        </h2>
        <p
          style={{
            color: 'var(--color-text-muted, #564245)',
            fontSize: '14px',
            lineHeight: 1.5,
            margin: '0 0 24px',
          }}
        >
          {message || 'Something went wrong while loading this page. Please try refreshing or return home.'}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              borderRadius: '9999px',
              border: '1px solid var(--color-outline-variant, #dcc0c4)',
              backgroundColor: 'transparent',
              color: 'var(--color-text, #2e2a28)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Reload Page
          </button>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '10px 20px',
              borderRadius: '9999px',
              backgroundColor: 'var(--color-blush, #e36888)',
              color: '#ffffff',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: '14px',
            }}
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

