import React from 'react'

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: React.ReactNode
  wrapperClassName?: string
}

export default function TextField({
  label,
  icon,
  wrapperClassName = '',
  className = '',
  children,
  ...props
}: TextFieldProps) {
  return (
    <>
      <div className={`tf-group ${wrapperClassName}`}>
        {label && (
          <label className="field-label">
            {icon}
            {label}
          </label>
        )}
        <input className={`pill-input ${className}`} {...props} />
        {children}
      </div>
      <style jsx>{`
        .tf-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
      `}</style>
    </>
  )
}
