import React from 'react'
import { Plus, DollarSign, ArrowRight, Trash2 } from 'lucide-react'
import { Button, Card, EmptyState, Badge } from '../ui'
import MemberAvatar from '../MemberAvatar'
import { formatDate } from '../../lib/format'
import { HangoutExpense, ExpenseSummary, DebtSettlement, MemberBalance } from './types'

interface ExpensesTabProps {
  expenses: HangoutExpense[]
  summary?: ExpenseSummary | null
  balances?: Record<string, number>
  debtsList?: DebtSettlement[]
  totalSpent?: number
  currentUserId: string
  creatorId?: string
  onOpenAddExpense: () => void
  onDeleteExpense?: (expenseId: string) => void
}

export const ExpensesTab: React.FC<ExpensesTabProps> = ({
  expenses,
  summary,
  balances = {},
  debtsList = [],
  totalSpent = 0,
  currentUserId,
  creatorId,
  onOpenAddExpense,
  onDeleteExpense,
}) => {
  const displayTotal = summary?.total_expenses ?? totalSpent
  const displayDebts = summary?.simplified_debts && summary.simplified_debts.length > 0
    ? summary.simplified_debts
    : debtsList
  const memberBalances = summary?.member_balances || []

  return (
    <div className="expenses-tab">
      {/* Summary Card */}
      <Card variant="default" padding="md" className="expense-summary-card">
        <div className="summary-left">
          <span className="summary-lbl">Total Spent</span>
          <h3>₱{displayTotal.toLocaleString()}</h3>
          <span className="summary-sub">
            {summary?.per_person_share !== undefined && summary.per_person_share > 0 ? (
              <>
                ₱{summary.per_person_share.toLocaleString()} / person • across {expenses.length} payments
              </>
            ) : (
              `across ${expenses.length} payment${expenses.length === 1 ? '' : 's'}`
            )}
          </span>
        </div>
        <Button onClick={onOpenAddExpense}>
          <Plus size={18} /> Log Expense
        </Button>
      </Card>

      {/* Spend Chart Breakdown */}
      {(memberBalances.length > 0 || Object.keys(balances).length > 0) && (
        <Card variant="default" padding="md" className="spend-chart-section">
          <h4>Member Spending & Net Balances</h4>
          <div className="chart-bars-list">
            {memberBalances.length > 0
              ? memberBalances.map((mb) => {
                  const pct = displayTotal > 0 ? (mb.total_paid / displayTotal) * 100 : 0
                  const isPositive = mb.net_balance > 0
                  const isNegative = mb.net_balance < 0
                  const username = mb.profile?.username || mb.user_id

                  return (
                    <div key={mb.user_id} className="chart-row">
                      <div className="chart-member-label">
                        <MemberAvatar profile={mb.profile} memberId={mb.user_id} size={24} />
                        <span className="member-name-ellipsis">{username}</span>
                      </div>
                      <div className="chart-bar-track">
                        <div
                          className="chart-bar-fill"
                          style={{
                            width: `${Math.max(pct, 4)}%`,
                            backgroundColor: isPositive ? 'var(--color-sea)' : 'var(--color-blush)',
                          }}
                        />
                        <span className="bar-val">₱{mb.total_paid.toLocaleString()}</span>
                      </div>
                      <div className="net-balance-tag">
                        {isPositive && (
                          <Badge variant="surface" size="sm">
                            +₱{Math.round(mb.net_balance).toLocaleString()}
                          </Badge>
                        )}
                        {isNegative && (
                          <Badge variant="blush" size="sm">
                            -₱{Math.round(Math.abs(mb.net_balance)).toLocaleString()}
                          </Badge>
                        )}
                        {!isPositive && !isNegative && (
                          <Badge variant="surface" size="sm">
                            Settled
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })
              : Object.entries(balances).map(([user, bal]) => {
                  const totalPaid = expenses
                    .filter((e) => e.paid_by === user)
                    .reduce((s, e) => s + e.total_amount, 0)
                  const pct = displayTotal > 0 ? (totalPaid / displayTotal) * 100 : 0

                  return (
                    <div key={user} className="chart-row">
                      <div className="chart-member-label">
                        <MemberAvatar memberId={user} size={24} />
                        <span className="member-name-ellipsis">{user}</span>
                      </div>
                      <div className="chart-bar-track">
                        <div
                          className="chart-bar-fill"
                          style={{
                            width: `${Math.max(pct, 4)}%`,
                            backgroundColor: bal >= 0 ? 'var(--color-sea)' : 'var(--color-blush)',
                          }}
                        />
                        <span className="bar-val">₱{totalPaid.toLocaleString()}</span>
                      </div>
                    </div>
                  )
                })}
          </div>
        </Card>
      )}

      {/* Simplified Debts Sheet */}
      {displayDebts.length > 0 && (
        <Card variant="default" padding="md" className="debts-section">
          <h4>Simplified Balances (Who Owes Whom)</h4>
          <div className="debts-list">
            {displayDebts.map((debt, index) => {
              const fromName = debt.from_user?.username || debt.from || 'Member'
              const toName = debt.to_user?.username || debt.to || 'Member'
              const fromId = debt.from_user_id || debt.from
              const toId = debt.to_user_id || debt.to

              return (
                <div key={index} className="debt-row-card">
                  <div className="debt-avatars">
                    <MemberAvatar profile={debt.from_user} memberId={fromId} size={28} />
                    <ArrowRight size={16} className="arrow-icon" />
                    <MemberAvatar profile={debt.to_user} memberId={toId} size={28} />
                  </div>
                  <div className="debt-message">
                    <strong>{fromName}</strong> owes <strong>{toName}</strong>
                  </div>
                  <Badge variant="blush" size="md">
                    ₱{Math.round(debt.amount).toLocaleString()}
                  </Badge>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Expense History List */}
      <Card variant="default" padding="md" className="expense-history-section">
        <h4>Expense History ({expenses.length})</h4>
        {expenses.length === 0 ? (
          <EmptyState
            icon={<DollarSign size={32} />}
            title="No expenses logged yet. Keep track of group splits here!"
          />
        ) : (
          <div className="expenses-grid">
            {expenses.map((exp) => {
              const payerName = exp.payer?.username || exp.paid_by || 'Member'
              const isPayerOrCreator =
                String(exp.paid_by) === String(currentUserId) ||
                String(creatorId) === String(currentUserId)
              const dateLabel = exp.created_at ? formatDate(exp.created_at, 'short') : ''

              return (
                <div key={exp.id} className="expense-row-item">
                  <div className="payer-col">
                    <MemberAvatar profile={exp.payer} memberId={exp.paid_by} size={36} />
                    <div>
                      <div className="exp-desc">{exp.description}</div>
                      <div className="exp-meta">
                        Paid by {payerName}
                        {exp.split_type === 'equal' ? ' • Equal Split' : ' • Personal'}
                        {dateLabel ? ` • ${dateLabel}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="amount-col">
                    <span className="exp-amt-val">₱{exp.total_amount.toLocaleString()}</span>
                    {isPayerOrCreator && onDeleteExpense && (
                      <button
                        type="button"
                        className="delete-expense-btn"
                        onClick={() => onDeleteExpense(exp.id)}
                        title="Delete expense"
                        aria-label="Delete expense"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <style jsx>{`
        .expenses-tab {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        :global(.expense-summary-card) {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, var(--tint-blush), var(--tint-butter)) !important;
          border: 1px solid rgba(227, 104, 136, 0.2) !important;
        }

        .summary-left {
          display: flex;
          flex-direction: column;
        }

        .summary-lbl {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .summary-left h3 {
          font-size: 32px;
          color: var(--color-text);
          margin: 2px 0;
        }

        .summary-sub {
          font-size: 13px;
          color: var(--color-text-muted);
        }

        h4 {
          font-size: 16px;
          color: var(--color-text);
          margin: 0 0 16px 0;
        }

        .chart-bars-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .chart-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .chart-member-label {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 90px;
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text);
        }

        .chart-bar-track {
          flex: 1;
          height: 24px;
          background-color: var(--color-surface-container);
          border-radius: 12px;
          position: relative;
          display: flex;
          align-items: center;
          padding: 0 8px;
          overflow: hidden;
        }

        .chart-bar-fill {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          border-radius: 12px;
          opacity: 0.85;
          transition: width 0.3s ease;
        }

        .bar-val {
          position: relative;
          z-index: 2;
          font-size: 12px;
          font-weight: 700;
          color: var(--color-text);
          margin-left: auto;
        }

        .debts-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .debt-row-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border-radius: 14px;
          background-color: var(--color-surface-container-low);
        }

        .debt-avatars {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        :global(.arrow-icon) {
          color: var(--color-outline);
        }

        .debt-message {
          font-size: 14px;
          color: var(--color-text);
        }

        .expenses-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .expense-row-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 14px;
          border-radius: 14px;
          background-color: var(--color-surface-container-low);
        }

        .payer-col {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .exp-desc {
          font-size: 15px;
          font-weight: 700;
          color: var(--color-text);
        }

        .exp-meta {
          font-size: 12px;
          color: var(--color-text-muted);
          margin-top: 2px;
        }

        .member-name-ellipsis {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .net-balance-tag {
          margin-left: 8px;
        }

        .amount-col {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .exp-amt-val {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 700;
          color: var(--color-text);
        }

        .delete-expense-btn {
          background: transparent;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: color 0.15s;
        }

        .delete-expense-btn:hover {
          color: #ff6b6b;
        }
      `}</style>
    </div>
  )
}
