import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const config = {
  runtime: 'edge',
}

export default async function handler(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const name = searchParams.get('name') || 'Friend Group'
  const creator = searchParams.get('creator') || ''
  const members = searchParams.get('members') || ''
  const cover = searchParams.get('cover')

  const renderCard = (includeCover: boolean) => {
    const hasCover = includeCover && Boolean(cover)

    return (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#fbf3ec',
          backgroundImage: 'linear-gradient(135deg, #fff9f6 0%, #fae6ec 50%, #f7ece5 100%)',
          padding: '48px 56px',
          fontFamily: 'sans-serif',
          color: '#2e2a28',
          position: 'relative',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#f08c21"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
              <path d="M20 3v4" />
              <path d="M22 5h-4" />
              <path d="M4 17v2" />
              <path d="M5 18H3" />
            </svg>
            <span
              style={{
                fontSize: 34,
                fontWeight: 800,
                color: '#e36888',
                letterSpacing: '-0.5px',
              }}
            >
              Hangout
            </span>
            <span
              style={{
                backgroundColor: '#fbe6eb',
                color: '#e36888',
                fontSize: 14,
                fontWeight: 800,
                padding: '4px 14px',
                borderRadius: 9999,
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              GROUP INVITE
            </span>
          </div>

          {creator ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                padding: '8px 18px',
                borderRadius: 9999,
                boxShadow: '0 4px 12px rgba(46, 42, 40, 0.08)',
                border: '1px solid #efe6e3',
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#e36888"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#2e2a28' }}>
                Created by {creator}
              </span>
            </div>
          ) : null}
        </div>

        {/* Content Body */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '40px',
            width: '100%',
            flex: 1,
            margin: '28px 0',
          }}
        >
          {/* Left Details */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '20px',
              flex: hasCover ? '1 1 620px' : '1 1 100%',
              maxWidth: hasCover ? '640px' : '100%',
            }}
          >
            <h1
              style={{
                fontSize: hasCover ? 48 : 56,
                fontWeight: 900,
                color: '#2e2a28',
                lineHeight: 1.15,
                margin: 0,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {name}
            </h1>

            {/* Details Box */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderRadius: 20,
                padding: '16px 20px',
                border: '1px solid rgba(227, 104, 136, 0.2)',
                boxShadow: '0 8px 24px rgba(46, 42, 40, 0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#e36888"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span style={{ fontSize: 19, fontWeight: 700, color: '#2e2a28' }}>
                  {members ? `${members} Members` : 'Friend Circle'}
                </span>
              </div>
              <span style={{ fontSize: 16, color: '#564245', fontWeight: 500 }}>
                Join this circle to plan hangouts, share notes, and preserve memories together.
              </span>
            </div>
          </div>

          {/* Right Framed Cover Image (if present) */}
          {hasCover && cover ? (
            <div
              style={{
                width: '420px',
                height: '380px',
                display: 'flex',
                borderRadius: '28px',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(46, 42, 40, 0.12)',
                border: '4px solid #ffffff',
                backgroundColor: '#ffffff',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cover}
                alt="Group Cover"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
          ) : null}
        </div>

        {/* Footer Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            paddingTop: '16px',
            borderTop: '1px solid rgba(137, 113, 117, 0.15)',
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 600, color: '#897175' }}>
            Shared memory, timeline & expense planning
          </span>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#e36888',
              color: '#ffffff',
              padding: '10px 24px',
              borderRadius: 9999,
              fontSize: 16,
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(227, 104, 136, 0.35)',
            }}
          >
            <span>Join Group</span>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    )
  }

  try {
    return new ImageResponse(renderCard(true), {
      width: 1200,
      height: 630,
    })
  } catch {
    return new ImageResponse(renderCard(false), {
      width: 1200,
      height: 630,
    })
  }
}
