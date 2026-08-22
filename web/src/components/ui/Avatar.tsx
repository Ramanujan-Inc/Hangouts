import React from 'react'

interface AvatarProps {
  src: string
  alt: string
  size?: number
  title?: string
  className?: string
}

export default function Avatar({ src, alt, size = 28, title, className = '' }: AvatarProps) {
  return (
    <>
      <img src={src} alt={alt} title={title} className={`avatar ${className}`} style={{ width: size, height: size }} />
      <style jsx>{`
        .avatar {
          border-radius: 50%;
          object-fit: cover;
          background-color: var(--color-surface-container);
          display: block;
        }
      `}</style>
    </>
  )
}
