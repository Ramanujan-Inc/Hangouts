import React from 'react'

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode
  children: React.ReactNode
}

export default function ActionButton({
  icon,
  children,
  className = '',
  type = 'button',
  ...props
}: ActionButtonProps) {
  return (
    <button
      type={type}
      className={`action-btn ${className}`}
      {...props}
    >
      {icon}
      <span>{children}</span>
      <style jsx>{`
        .action-btn {
          background: none;
          border: none;
          padding: 0;
          font-family: inherit;
          font-size: 12px;
          font-weight: 700;
          color: var(--color-sea);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: opacity 0.15s;
        }

        .action-btn:hover:not(:disabled) {
          opacity: 0.8;
          text-decoration: underline;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </button>
  )
}
