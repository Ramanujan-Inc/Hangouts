import React, { useState } from 'react'
import { Modal, TextField, Button, Badge } from '../ui'
import MemberAvatar from '../MemberAvatar'
import { members } from '../../data/mock'

interface AddExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  participants: string[]
  onAddExpense: (
    amount: number,
    desc: string,
    paidBy: string,
    splitWith: string[]
  ) => void
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  participants,
  onAddExpense,
}) => {
  const [expAmount, setExpAmount] = useState('')
  const [expDesc, setExpDesc] = useState('')
  const [expPaidBy, setExpPaidBy] = useState(participants[0] || 'mika')
  const [expSplitWith, setExpSplitWith] = useState<string[]>(participants)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(expAmount)
    if (isNaN(amt) || amt <= 0 || !expDesc.trim()) return

    onAddExpense(amt, expDesc.trim(), expPaidBy, expSplitWith)
    setExpAmount('')
    setExpDesc('')
    onClose()
  }

  const parsedAmount = parseFloat(expAmount)
  const perPersonShare =
    !isNaN(parsedAmount) && parsedAmount > 0 && expSplitWith.length > 0
      ? Math.round(parsedAmount / expSplitWith.length)
      : null

  return (
    <Modal onClose={onClose} title="Log a Group Expense">
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
          placeholder="e.g. Ramen Bowls"
          value={expDesc}
          onChange={(e) => setExpDesc(e.target.value)}
        />

        <div className="payer-field">
          <label className="field-label">Paid by:</label>
          <div className="payer-chips">
            {participants.map((p) => (
              <div
                key={p}
                className={`payer-chip ${expPaidBy === p ? 'active' : ''}`}
                onClick={() => setExpPaidBy(p)}
                role="button"
                tabIndex={0}
              >
                <MemberAvatar memberId={p} size={20} />
                <span>{members[p]?.name || p}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Splits Indicator */}
        {perPersonShare !== null && (
          <div className="split-badge-wrapper">
            <Badge variant="surface" size="md">
              Split equally — ₱{perPersonShare} each
            </Badge>
          </div>
        )}

        <div className="modal-btn-row">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit">Save Expense</Button>
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
