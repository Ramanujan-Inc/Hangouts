import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: React.ReactNode
}

export default function PasswordInput({ label = 'Password', icon, children, ...props }: PasswordInputProps) {
  const [show, setShow] = useState(false)

  return (
    <>
      <div className="pw-group">
        {label && (
          <label className="field-label">
            {icon}
            {label}
          </label>
        )}
        <div className="pw-field">
          <input type={show ? 'text' : 'password'} className="pill-input pw-input" {...props} />
          <button
            type="button"
            className="pw-toggle"
            onClick={() => setShow(!show)}
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {children}
      </div>
      <style jsx>{`
        .pw-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .pw-field {
          position: relative;
          display: flex;
          align-items: center;
        }

        .pw-input {
          width: 100%;
          padding-right: 2.5rem;
        }

        .pw-toggle {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }
      `}</style>
    </>
  )
}
