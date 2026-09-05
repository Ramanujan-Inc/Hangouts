import React, { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Sparkles, Calendar, Clock, MapPin, Users, Check, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { api } from '../../../lib/api'
import { getAvatarUrl } from '../../../lib/avatar'
import { formatDate } from '../../../lib/format'
import { getHangoutUrl } from '../../../lib/hangoutUrl'
import { Button, Card, Spinner, Toast } from '../../../components/ui'

interface HangoutPreview {
  id: string
  title: string
  description?: string | null
  hangout_date: string
  hangout_time?: string | null
  location_name?: string | null
  formatted_address?: string | null
  cover_photo_url?: string | null
  invite_code: string
  short_id?: string | null
  creator?: {
    id: string
    username: string
    avatar_url?: string | null
  } | null
  participant_count: number
  is_participant: boolean
}

interface JoinHangoutPageProps {
  code: string
  initialData: HangoutPreview | null
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const code = (context.params?.code as string) || ''
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1'

  try {
    const res = await fetch(`${apiUrl}/hangouts/join/${code}`)
    if (res.ok) {
      const initialData = await res.json()
      return { props: { code, initialData } }
    }
  } catch (err) {
    // Fallback to client-side fetch
  }

  return { props: { code, initialData: null } }
}

export default function JoinHangoutPage({ code, initialData }: JoinHangoutPageProps) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [hangout, setHangout] = useState<HangoutPreview | null>(initialData)
  const [loading, setLoading] = useState<boolean>(!initialData)
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // Client-side fetch or revalidate with authenticated status
  useEffect(() => {
    async function loadPreview() {
      if (!code) return
      try {
        setLoading(true)
        const data = await api.get<HangoutPreview>(`/hangouts/join/${code}`)
        setHangout(data)
        setError(null)
      } catch (err: any) {
        console.error('Failed to load hangout preview:', err)
        setError(err.message || 'Invalid or expired hangout invite link.')
      } finally {
        setLoading(false)
      }
    }

    // Always fetch client-side if no initial data or if user is logged in (to get is_participant status)
    if (!initialData || user) {
      loadPreview()
    }
  }, [code, user])

  const handleJoin = async () => {
    if (!code) return
    try {
      setJoining(true)
      const res = await api.post<any>(`/hangouts/join/${code}`)
      setToastMessage(`You joined "${hangout?.title || 'Hangout'}"!`)
      setTimeout(() => {
        router.push(getHangoutUrl(res || hangout))
      }, 800)
    } catch (err: any) {
      setError(err.message || 'Failed to join hangout.')
      setJoining(false)
    }
  }

  const handleSignInRedirect = () => {
    router.push(`/?redirect=/join/hangout/${code}`)
  }

  const creatorAvatar = getAvatarUrl(hangout?.creator?.avatar_url)
  const hostName = hangout?.creator?.username || 'Host'

  return (
    <div className="join-page-wrapper">
      <Head>
        <title>{hangout ? `Join ${hangout.title} | Hangout` : 'Join Hangout'}</title>
        {hangout && (
          <>
            <meta property="og:title" content={`Join "${hangout.title}" on Hangout`} />
            <meta
              property="og:description"
              content={
                hangout.description ||
                `Hangout scheduled for ${formatDate(hangout.hangout_date, 'long')}${
                  hangout.location_name ? ` at ${hangout.location_name}` : ''
                }. Click to view details and join!`
              }
            />
            {hangout.cover_photo_url && (
              <meta property="og:image" content={hangout.cover_photo_url} />
            )}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={`Join "${hangout.title}" on Hangout`} />
            {hangout.cover_photo_url && (
              <meta name="twitter:image" content={hangout.cover_photo_url} />
            )}
          </>
        )}
      </Head>

      <Toast
        message={toastMessage}
        isOpen={Boolean(toastMessage)}
        onClose={() => setToastMessage('')}
      />

      <div className="join-content">
        {/* Brand header */}
        <div className="brand-header" onClick={() => router.push('/')}>
          <Sparkles size={24} className="sparkle-icon" />
          <span className="brand-text">Hangout</span>
        </div>

        {loading || authLoading ? (
          <div className="state-card">
            <Spinner label="Loading hangout details..." />
          </div>
        ) : error || !hangout ? (
          <Card className="error-card">
            <div className="error-icon-wrapper">
              <AlertCircle size={40} />
            </div>
            <h3>Invite Link Expired</h3>
            <p>
              This hangout invite link might have expired or doesn't exist. Please check the link or
              ask the host for a new invite.
            </p>
            <Button onClick={() => router.push('/')}>Go to Home</Button>
          </Card>
        ) : (
          <div className="preview-card">
            {/* Cover image banner */}
            <div
              className="cover-banner"
              style={{
                backgroundImage: hangout.cover_photo_url
                  ? `url(${hangout.cover_photo_url})`
                  : 'linear-gradient(135deg, var(--color-surface-container), var(--tint-blush))',
              }}
            >
              <div className="host-pill">
                <img src={creatorAvatar} alt={hostName} className="host-avatar" />
                <span className="host-name">Hosted by @{hostName}</span>
              </div>
            </div>

            <div className="card-body">
              <div className="title-row">
                <h2>{hangout.title}</h2>
              </div>

              {hangout.description && (
                <p className="hangout-desc">{hangout.description}</p>
              )}

              <div className="meta-list">
                <div className="meta-row">
                  <Calendar size={18} className="meta-icon" />
                  <div className="meta-text">
                    <span className="meta-primary">
                      {formatDate(hangout.hangout_date, 'long')}
                    </span>
                    {hangout.hangout_time && (
                      <span className="meta-secondary">
                        <Clock size={14} />
                        {hangout.hangout_time.substring(0, 5)}
                      </span>
                    )}
                  </div>
                </div>

                {hangout.location_name && (
                  <div className="meta-row">
                    <MapPin size={18} className="meta-icon loc-icon" />
                    <div className="meta-text">
                      <span className="meta-primary">{hangout.location_name}</span>
                      {hangout.formatted_address &&
                        hangout.formatted_address !== hangout.location_name && (
                          <span className="meta-secondary">{hangout.formatted_address}</span>
                        )}
                    </div>
                  </div>
                )}

                <div className="meta-row">
                  <Users size={18} className="meta-icon" />
                  <div className="meta-text">
                    <span className="meta-primary">
                      {hangout.participant_count}{' '}
                      {hangout.participant_count === 1 ? 'attendee' : 'attendees'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="cta-section">
                {!user ? (
                  <div className="auth-prompt">
                    <p className="prompt-text">Sign in to join this hangout and RSVP.</p>
                    <Button size="default" fullWidth onClick={handleSignInRedirect}>
                      Sign in to Join
                    </Button>
                  </div>
                ) : hangout.is_participant ? (
                  <div className="joined-prompt">
                    <div className="joined-badge">
                      <Check size={16} />
                      <span>You are already attending this hangout</span>
                    </div>
                    <Button
                      size="default"
                      fullWidth
                      onClick={() => router.push(getHangoutUrl(hangout))}
                    >
                      View Hangout
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="default"
                    fullWidth
                    disabled={joining}
                    onClick={handleJoin}
                  >
                    {joining ? (
                      <>
                        <Loader2 size={18} className="spin-icon" />
                        <span>Joining...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        <span>Join Hangout</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .join-page-wrapper {
          min-height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--color-background);
          padding: 24px 16px;
        }

        .join-content {
          width: 100%;
          max-width: 480px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .brand-header {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-family: var(--font-display);
          font-size: 24px;
          font-weight: 700;
          color: var(--color-blush);
        }

        :global(.sparkle-icon) {
          color: var(--color-tangerine);
        }

        .state-card {
          padding: 60px;
          text-align: center;
        }

        :global(.error-card) {
          text-align: center;
          padding: 40px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .error-icon-wrapper {
          color: var(--color-blush);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .preview-card {
          width: 100%;
          background-color: var(--color-surface-container-lowest);
          border-radius: 28px;
          box-shadow: var(--shadow-ambient), 0 20px 40px rgba(0, 0, 0, 0.08);
          border: 1px solid var(--color-surface-container-high);
          overflow: hidden;
        }

        .cover-banner {
          height: 190px;
          background-size: cover;
          background-position: center;
          position: relative;
          display: flex;
          align-items: flex-start;
          justify-content: flex-start;
          padding: 16px;
        }

        .host-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: var(--color-surface-container-lowest);
          backdrop-filter: blur(8px);
          padding: 4px 12px 4px 4px;
          border-radius: 9999px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .host-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          object-fit: cover;
          background-color: var(--color-surface-container);
        }

        .host-name {
          font-size: 12px;
          font-weight: 700;
          color: var(--color-text);
          font-family: var(--font-display);
        }

        .card-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .title-row h2 {
          font-size: 26px;
          color: var(--color-text);
          margin: 0;
        }

        .hangout-desc {
          font-size: 14px;
          color: var(--color-text-muted);
          line-height: 1.5;
          margin: 0;
        }

        .meta-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 14px 16px;
          background-color: var(--color-surface-container-low);
          border-radius: 16px;
        }

        .meta-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        :global(.meta-icon) {
          color: var(--color-text-muted);
          margin-top: 2px;
          flex-shrink: 0;
        }

        :global(.loc-icon) {
          color: var(--color-blush);
        }

        .meta-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .meta-primary {
          font-size: 14px;
          font-weight: 700;
          color: var(--color-text);
        }

        .meta-secondary {
          font-size: 12px;
          color: var(--color-text-muted);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .cta-section {
          margin-top: 8px;
        }

        .auth-prompt,
        .joined-prompt {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
          width: 100%;
        }

        .prompt-text {
          font-size: 13px;
          color: var(--color-text-muted);
          margin: 0;
        }

        .joined-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
          color: var(--color-sea);
          background-color: var(--tint-sea);
          padding: 6px 14px;
          border-radius: 9999px;
        }

        :global(.spin-icon) {
          animation: spin 0.8s linear infinite;
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
