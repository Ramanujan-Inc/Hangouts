import React from 'react'

interface StackAvatar {
  src: string
  alt: string
  title?: string
}

interface AvatarStackProps {
  avatars: StackAvatar[]
  size?: number
  overlap?: number
}

export default function AvatarStack({ avatars, size = 28, overlap = 8 }: AvatarStackProps) {
  return (
    <>
      <div className="avatar-stack">
        {avatars.map((avatar, i) => (
          <img
            key={avatar.alt}
            src={avatar.src}
            alt={avatar.alt}
            title={avatar.title}
            className="stack-avatar"
            style={{
              width: size,
              height: size,
              zIndex: 10 - i,
              transform: `translateX(-${i * overlap}px)`,
            }}
          />
        ))}
      </div>
      <style jsx>{`
        .avatar-stack {
          display: flex;
          align-items: center;
          padding-right: 8px;
        }

        .stack-avatar {
          border-radius: 50%;
          border: 2px solid white;
          background-color: var(--color-surface-container);
          object-fit: cover;
        }
      `}</style>
    </>
  )
}
