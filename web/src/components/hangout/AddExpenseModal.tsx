import React, { useState } from 'react'
import { Modal, TextField, Button, Badge } from '../ui'
import MemberAvatar from '../MemberAvatar'
import { HangoutParticipant } from './types'

interface AddExpenseModalProps {
  isOpen: boolean
  isSubmitting?: boolean
  onClose: () => void
  participants: (HangoutParticipant | { user_id: string; profile?: any })[]
  currentUserId?: string
  onAddExpense: (
    amount: number,
    description: string,
    paidBy: string,
    splitType: 'equal' | 'personal'
  ) => Promise<void> | void
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  isSubmitting = false,
  onClose,
  participants,
  currentUserId,
  onAddExpense,
}) => {
  const defaultPayer =
    currentUserId || (participants[0] ? participants[0].user_id : '')

  const [expAmount, setExpAmount] = useState('')
  const [expDesc, setExpDesc] = useState('')
  const [expPaidBy, setExpPaidBy] = useState(defaultPayer)
  const [splitType, setSplitType] = useState<'equal' | 'personal'>('equal')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(expAmount)
    const paidBy = splitType === 'personal' ? (currentUserId || expPaidBy) : expPaidBy
    if (isNaN(amt) || amt <= 0 || !expDesc.trim() || !paidBy) return

    await onAddExpense(amt, expDesc.trim(), paidBy, splitType)
    setExpAmount('')
    setExpDesc('')
    setSplitType('equal')
    onClose()
  }

  const parsedAmount = parseFloat(expAmount)
  const participantCount = Math.max(participants.length, 1)
  const perPersonShare =
    !isNaN(parsedAmount) && parsedAmount > 0
      ? Math.round((parsedAmount / participantCount) * 100) / 100
      : null

  return (
    <Modal onClose={onClose} title="Log a Hangout Expense">
      <form onSubmit={handleSubmit} className="expense-modal-form">
        {/* Oversized Amount Field */}
        <div className="amount-input-wrapper">
          <span className="currency-lbl">₱</span>
          <input
            type="number"
            step="any"
            required
            placeholder="0.00"
            value={expAmount}
            onChange={(e) => setExpAmount(e.target.value)}
            className="giant-amount-input"
            autoFocus
          />
        </div>

        <TextField
          label="What was this for?"
          required
          placeholder="e.g. Ramen Bowls, Drinks, Groceries"
          value={expDesc}
          onChange={(e) => setExpDesc(e.target.value)}
        />

        {splitType !== 'personal' && (
          <div className="payer-field">
            <label className="field-label">Paid by:</label>
            <div className="payer-chips">
              {participants.map((p) => {
                const uid = p.user_id
                const uname = p.profile?.username || uid
                const isSelected = expPaidBy === uid

                return (
                  <div
                    key={uid}
                    className={`payer-chip ${isSelected ? 'active' : ''}`}
                    onClick={() => setExpPaidBy(uid)}
                    role="button"
                    tabIndex={0}
                  >
                    <MemberAvatar profile={p.profile} memberId={uid} size={20} />
                    <span>{uname}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="split-type-field">
          <label className="field-label">Split Type:</label>
          <div className="split-buttons">
            <button
              type="button"
              className={`split-pill-btn ${splitType === 'equal' ? 'active' : ''}`}
              onClick={() => setSplitType('equal')}
            >
              Equal Split ({participantCount} people)
            </button>
            <button
              type="button"
              className={`split-pill-btn ${splitType === 'personal' ? 'active' : ''}`}
              onClick={() => {
                setSplitType('personal')
                if (currentUserId) setExpPaidBy(currentUserId)
              }}
            >
              Personal Expense
            </button>
          </div>
        </div>

        {/* Dynamic Splits Indicator */}
        {splitType === 'equal' && perPersonShare !== null && (
          <div className="split-badge-wrapper">
            <Badge variant="surface" size="md">
              Split equally — ₱{perPersonShare.toLocaleString()} each ({participantCount} members)
            </Badge>
          </div>
        )}

        {splitType === 'personal' && (
          <div className="split-badge-wrapper">
            <Badge variant="surface" size="md">
              Personal expense — only visible to you
            </Badge>
          </div>
        )}

        <div className="modal-btn-row">
          <Button variant="outline" onClick={onClose} type="button" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={!expAmount || !expDesc.trim() || isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Expense'}
          </Button>
        </div>
      </form>

      <style jsx>{`
        .expense-modal-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .amount-input-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          margin: 10px 0;
        }

        .currency-lbl {
          font-family: var(--font-display);
          font-size: 32px;
          font-weight: 700;
          color: var(--color-blush);
        }

        .giant-amount-input {
          font-family: var(--font-display);
          font-size: 44px;
          font-weight: 700;
          width: 200px;
          border: none;
          outline: none;
          background: transparent;
          color: var(--color-text);
          text-align: left;
        }

        .payer-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .field-label {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 14px;
          color: var(--color-text);
        }

        .payer-chips {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .payer-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 9999px;
          background-color: var(--color-surface-container-low);
          border: 1px solid var(--color-surface-container-high);
          cursor: pointer;
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text-muted);
          transition: all 0.15s;
        }

        .payer-chip:hover {
          border-color: var(--color-blush);
          color: var(--color-text);
        }

        .payer-chip.active {
          background-color: var(--tint-blush);
          border-color: var(--color-blush);
          color: var(--color-blush);
        }

        .split-type-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .split-buttons {
          display: flex;
          gap: 8px;
        }

        .split-pill-btn {
          flex: 1;
          padding: 8px 12px;
          border-radius: 10px;
          border: 1px solid var(--color-surface-container-high);
          background-color: var(--color-surface-container-low);
          color: var(--color-text-muted);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
        }

        .split-pill-btn.active {
          background-color: var(--color-surface-container);
          border-color: var(--color-blush);
          color: var(--color-blush);
        }

        .split-badge-wrapper {
          text-align: center;
          margin-top: 4px;
        }

        .modal-btn-row {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 8px;
        }
      `}</style>
    </Modal>
  )
}
