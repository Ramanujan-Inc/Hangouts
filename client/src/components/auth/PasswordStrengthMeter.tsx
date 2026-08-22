import React from 'react'

export interface PasswordStrength {
  label: 'Empty' | 'Weak' | 'Medium' | 'Strong'
  color: string
  width: string
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { label: 'Empty', color: 'var(--color-surface-container)', width: '0%' }
  if (password.length < 4) return { label: 'Weak', color: 'var(--color-blush)', width: '33%' }
  if (password.length < 8) return { label: 'Medium', color: 'var(--color-tangerine)', width: '66%' }
  return { label: 'Strong', color: 'var(--color-matcha)', width: '100%' }
}

interface PasswordStrengthMeterProps {
  password: string
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  if (!password) return null

  const strength = getPasswordStrength(password)

  return (
    <div className="strength-meter">
      <div className="strength-bar" style={{ width: strength.width, backgroundColor: strength.color }} />
      <span className="strength-label">Password strength: {strength.label}</span>

      <style jsx>{`
        .strength-meter {
          margin-top: 6px;
        }

        .strength-bar {
          height: 6px;
          border-radius: 3px;
          transition: width 0.3s, background-color 0.3s;
        }

        .strength-label {
          font-size: 11px;
          color: var(--color-text-muted);
          margin-top: 4px;
          display: block;
        }
      `}</style>
    </div>
  )
}
