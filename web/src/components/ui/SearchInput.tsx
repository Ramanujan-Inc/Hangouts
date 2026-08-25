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

        .search-icon {
          position: absolute;
          left: 18px;
          color: var(--color-text-muted);
          z-index: 1;
          pointer-events: none;
          transition: color 0.2s ease;
        }

        .search-wrapper:focus-within .search-icon {
          color: var(--color-blush);
        }

        .search-input {
          width: 100%;
          padding: 14px 20px 14px 48px;
          background-color: var(--color-surface-container-lowest);
          border: 1px solid var(--color-surface-container-high);
          box-shadow: var(--shadow-ambient);
          color: var(--color-text);
          font-family: var(--font-body);
          font-size: 15px;
          border-radius: 9999px;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
        }

        .search-input::placeholder {
          color: var(--color-text-muted);
          opacity: 0.75;
        }

        .search-input:focus {
          border-color: var(--color-blush);
          background-color: var(--color-surface-container-lowest);
          box-shadow: 0 0 0 3px var(--tint-blush);
        }
      `}</style>
    </>
  )
}
