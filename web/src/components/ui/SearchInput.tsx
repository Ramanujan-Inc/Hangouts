import React from 'react'
import { Search } from 'lucide-react'

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputClassName?: string
}

export default function SearchInput({ inputClassName = '', placeholder = 'Search...', ...props }: SearchInputProps) {
  return (
    <>
      <div className="search-wrapper">
        <Search className="search-icon" size={20} />
        <input type="text" className={`pill-input search-input ${inputClassName}`} placeholder={placeholder} {...props} />
      </div>
      <style jsx>{`
        .search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 18px;
          color: var(--color-text-muted);
          z-index: 1;
          pointer-events: none;
        }

        .search-input {
          padding: 14px 20px 14px 48px;
          box-shadow: inset 0 2px 4px rgba(46, 42, 40, 0.08);
        }
      `}</style>
    </>
  )
}
