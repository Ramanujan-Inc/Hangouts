import React from 'react'
import { Search } from 'lucide-react'

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputClassName?: string
}

export default function SearchInput({ inputClassName = '', placeholder = 'Search...', ...props }: SearchInputProps) {
  return (
    <>
      <div className="search-wrapper">
        <div className="search-icon-wrapper" aria-hidden="true">
          <Search size={18} />
        </div>
        <input
          type="text"
          className={`pill-input search-input ${inputClassName}`}
          placeholder={placeholder}
          {...props}
        />
      </div>
      <style jsx>{`
        .search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .search-icon-wrapper {
          position: absolute;
          left: 16px;
          color: var(--color-text-muted);
          z-index: 1;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s ease;
        }

        .search-wrapper:focus-within .search-icon-wrapper {
          color: var(--color-blush);
        }

        .search-input {
          width: 100%;
          padding-left: 44px;
        }
      `}</style>
    </>
  )
}
