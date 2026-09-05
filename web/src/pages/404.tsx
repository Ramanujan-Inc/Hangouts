import Head from 'next/head'
import Link from 'next/link'

export default function Custom404() {
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
        <title>404 - Page Not Found</title>
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
            fontSize: '56px',
            margin: '0 0 8px',
            color: 'var(--color-blush, #e36888)',
            fontWeight: 700,
          }}
        >
          404
        </h1>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 600,
            margin: '0 0 12px',
          }}
        >
          Page not found
        </h2>
        <p
          style={{
            color: 'var(--color-text-muted, #564245)',
            fontSize: '14px',
            lineHeight: 1.5,
            margin: '0 0 24px',
          }}
        >
          The hangout, page, or resource you are looking for does not exist or has moved.
        </p>
        <div>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '10px 24px',
              borderRadius: '9999px',
              backgroundColor: 'var(--color-blush, #e36888)',
              color: '#ffffff',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: '14px',
            }}
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

