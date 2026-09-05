import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'default' | 'compact' | 'small'
  fullWidth?: boolean
}

export default function Button({
  variant = 'primary',
  size = 'default',
  fullWidth = false,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`pill-button pill-button-${variant} ${size !== 'default' ? size : ''} ${fullWidth ? 'full-width' : ''} ${props.disabled ? 'disabled' : ''} ${className}`}
      {...props}
    />
  )
}
