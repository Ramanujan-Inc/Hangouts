import React from 'react'
import { Plus, DollarSign, ArrowRight } from 'lucide-react'
import { Button, Card, EmptyState, Badge } from '../ui'
import MemberAvatar from '../MemberAvatar'
import { members } from '../../data/mock'
import { HangoutExpense, DebtSettlement } from './types'

interface ExpensesTabProps {
  expenses: HangoutExpense[]
  balances: Record<string, number>
  debtsList: DebtSettlement[]
  totalSpent: number
  onOpenAddExpense: () => void
}

export const ExpensesTab: React.FC<ExpensesTabProps> = ({
  expenses,
  balances,
  debtsList,
  totalSpent,
  onOpenAddExpense,
}) => {
  return (
    <div className="expenses-tab">
      {/* Summary Card */}
      <Card variant="default" padding="md" className="expense-summary-card">
        <div className="summary-left">
          <span className="summary-lbl">Total Spent</span>
          <h3>₱{totalSpent.toLocaleString()}</h3>
          <span className="summary-sub">across {expenses.length} payments</span>
        </div>
        <Button onClick={onOpenAddExpense}>
          <Plus size={18} /> Log Expense
        </Button>
      </Card>

      {/* Spend Chart Breakdown */}
      {expenses.length > 0 && (
        <Card variant="default" padding="md" className="spend-chart-section">
          <h4>Member Spending Breakdown</h4>
          <div className="chart-bars-list">
            {Object.entries(balances).map(([user]) => {
              const totalPaid = expenses
                .filter((e) => e.paidBy === user)
                .reduce((s, e) => s + e.amount, 0)
              const pct = totalSpent > 0 ? (totalPaid / totalSpent) * 100 : 0

              const getBarColor = (uid: string) => {
                if (uid === 'mika') return 'var(--color-blush)'
                if (uid === 'jam') return 'var(--color-tangerine)'
                return 'var(--color-sea)'
              }

              return (
                <div key={user} className="chart-row">
                  <div className="chart-member-label">
                    <MemberAvatar memberId={user} size={24} />
                    <span>{members[user]?.name || user}</span>
                  </div>
                  <div className="chart-bar-track">
                    <div
                      className="chart-bar-fill"
                      style={{
                        width: `${Math.max(pct, 5)}%`,
                        backgroundColor: getBarColor(user),
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
      {debtsList.length > 0 && (
        <Card variant="default" padding="md" className="debts-section">
          <h4>Simplified Balances (Who Owes Whom)</h4>
          <div className="debts-list">
            {debtsList.map((debt, index) => (
              <div key={index} className="debt-row-card">
                <div className="debt-avatars">
                  <MemberAvatar memberId={debt.from} size={28} />
                  <ArrowRight size={16} className="arrow-icon" />
                  <MemberAvatar memberId={debt.to} size={28} />
                </div>
                <div className="debt-message">
                  <strong>{members[debt.from]?.name || debt.from}</strong> owes{' '}
                  <strong>{members[debt.to]?.name || debt.to}</strong>
                </div>
                <Badge variant="blush" size="md">
                  ₱{debt.amount}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Expense History List */}
      <Card variant="default" padding="md" className="expense-history-section">
        <h4>Expense History</h4>
        {expenses.length === 0 ? (
          <EmptyState
            icon={<DollarSign size={32} />}
            title="No expenses logged yet. Keep track of group splits here!"
          />
        ) : (
          <div className="expenses-grid">
            {expenses.map((exp) => (
              <div key={exp.id} className="expense-row-item">
                <div className="payer-col">
                  <MemberAvatar memberId={exp.paidBy} size={36} />
                  <div>
                    <div className="exp-desc">{exp.desc}</div>
                    <div className="exp-meta">
                      Paid by {members[exp.paidBy]?.name || exp.paidBy} • Split among{' '}
                      {exp.splitWith.length}
                    </div>
                  </div>
                </div>
                <div className="amount-col">
                  <span>₱{exp.amount.toLocaleString()}</span>
                </div>
              </div>
            ))}
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

        .amount-col span {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 700;
          color: var(--color-text);
        }
      `}</style>
    </div>
  )
}
