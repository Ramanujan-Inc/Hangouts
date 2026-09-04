import React, { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Sparkles, Users, Check, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { api } from '../../../lib/api'
import { getAvatarUrl } from '../../../lib/avatar'
import { Button, Card, Spinner, Toast } from '../../../components/ui'

interface GroupPreview {
  id: string
  name: string
  cover_image_url?: string | null
  invite_code: string
  created_at: string
  creator?: {
    id: string
    username: string
    avatar_url?: string | null
  } | null
  member_count: number
  user_status?: string | null
}

interface JoinGroupPageProps {
  code: string
  initialData: GroupPreview | null
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const code = (context.params?.code as string) || ''
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1'

  try {
    const res = await fetch(`${apiUrl}/groups/join/${code}`)
    if (res.ok) {
      const initialData = await res.json()
      return { props: { code, initialData } }
    }
  } catch (err) {
    // Fallback to client-side fetch
  }

  return { props: { code, initialData: null } }
}

export default function JoinGroupPage({ code, initialData }: JoinGroupPageProps) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [group, setGroup] = useState<GroupPreview | null>(initialData)
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
        const data = await api.get<GroupPreview>(`/groups/join/${code}`)
        setGroup(data)
        setError(null)
      } catch (err: any) {
        console.error('Failed to load group preview:', err)
        setError(err.message || 'Invalid or expired group invite link.')
      } finally {
        setLoading(false)
      }
    }

    if (!initialData || user) {
      loadPreview()
    }
  }, [code, user])

  const handleJoin = async () => {
    if (!code) return
    try {
      setJoining(true)
      await api.post<any>(`/groups/join/${code}`)
      setToastMessage(`Joined "${group?.name || 'Group'}"!`)
      setTimeout(() => {
        router.push('/groups')
      }, 800)
    } catch (err: any) {
      setError(err.message || 'Failed to join group.')
      setJoining(false)
    }
  }

  const handleSignInRedirect = () => {
    router.push(`/?redirect=/join/group/${code}`)
  }

  const creatorAvatar = getAvatarUrl(group?.creator?.avatar_url)
  const creatorName = group?.creator?.username || 'Creator'

  return (
    <div className="join-page-wrapper">
      <Head>
        <title>{group ? `Join ${group.name} | Hangout` : 'Join Group'}</title>
        {group && (
          <>
            <meta property="og:title" content={`Join "${group.name}" on Hangout`} />
            <meta
              property="og:description"
              content={`Join the "${group.name}" friend circle on Hangout to plan hangouts, share notes, and preserve memories together.`}
            />
            {group.cover_image_url && (
              <meta property="og:image" content={group.cover_image_url} />
            )}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={`Join "${group.name}" on Hangout`} />
            {group.cover_image_url && (
              <meta name="twitter:image" content={group.cover_image_url} />
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
            <Spinner label="Loading group details..." />
          </div>
        ) : error || !group ? (
          <Card className="error-card">
            <div className="error-icon-wrapper">
              <AlertCircle size={40} />
            </div>
            <h3>Invite Link Expired</h3>
            <p>
              This group invite link might have expired or doesn't exist. Please check the link or
              ask a member for a new invite.
            </p>
            <Button onClick={() => router.push('/')}>Go to Home</Button>
          </Card>
        ) : (
          <div className="preview-card">
            {/* Cover image banner */}
            <div
              className="cover-banner"
              style={{
                backgroundImage: group.cover_image_url
                  ? `url(${group.cover_image_url})`
                  : 'linear-gradient(135deg, var(--color-surface-container), var(--tint-butter))',
              }}
            >
              <div className="creator-pill">
                <img src={creatorAvatar} alt={creatorName} className="creator-avatar" />
                <span className="creator-name">Created by @{creatorName}</span>
              </div>
            </div>

            <div className="card-body">
              <div className="title-row">
                <h2>{group.name}</h2>
              </div>

              <div className="meta-row">
                <Users size={18} className="meta-icon" />
                <span className="meta-text">
                  {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
                </span>
              </div>

              <p className="group-hint">
                Joining this group lets you view and organize hangouts, plan events, and share
                memories together with everyone in this circle.
              </p>

              {/* Action CTA */}
              <div className="cta-section">
                {!user ? (
                  <div className="auth-prompt">
                    <p className="prompt-text">Sign in to accept this group invitation.</p>
                    <Button size="default" fullWidth onClick={handleSignInRedirect}>
                      Sign in to Join
                    </Button>
                  </div>
                ) : group.user_status === 'accepted' ? (
                  <div className="joined-prompt">
                    <div className="joined-badge">
                      <Check size={16} />
                      <span>You are already a member of this group</span>
                    </div>
                    <Button
                      size="default"
                      fullWidth
                      onClick={() => router.push('/groups')}
                    >
                      Go to Groups
                    </Button>
                  </div>
                ) : group.user_status === 'pending' ? (
                  <Button
                    size="default"
                    fullWidth
                    disabled={joining}
                    onClick={handleJoin}
                  >
                    {joining ? (
                      <>
                        <Loader2 size={18} className="spin-icon" />
                        <span>Accepting...</span>
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        <span>Accept Invitation & Join</span>
                      </>
                    )}
                  </Button>
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
                        <span>Join Group</span>
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
          max-width: 460px;
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
          height: 180px;
          background-size: cover;
          background-position: center;
          position: relative;
          display: flex;
          align-items: flex-start;
          justify-content: flex-start;
          padding: 16px;
        }

        .creator-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: var(--color-surface-container-lowest);
          backdrop-filter: blur(8px);
          padding: 4px 12px 4px 4px;
          border-radius: 9999px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .creator-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          object-fit: cover;
          background-color: var(--color-surface-container);
        }

        .creator-name {
          font-size: 12px;
          font-weight: 700;
          color: var(--color-text);
          font-family: var(--font-display);
        }

        .card-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .title-row h2 {
          font-size: 26px;
          color: var(--color-text);
          margin: 0;
        }

        .meta-row {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--color-text);
        }

        :global(.meta-icon) {
          color: var(--color-tangerine);
        }

        .meta-text {
          font-size: 14px;
          font-weight: 700;
        }

        .group-hint {
          font-size: 13px;
          color: var(--color-text-muted);
          line-height: 1.5;
          margin: 0;
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
