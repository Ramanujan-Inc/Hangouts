import React from 'react'
import { Calendar, Clock } from 'lucide-react'
import { TextField, ActionButton } from '../ui'

interface DateTimeInputProps {
  date: string
  time: string
  showTimeInput: boolean
  onDateChange: (val: string) => void
  onTimeChange: (val: string) => void
  onToggleTimeInput: (show: boolean) => void
}

export const DateTimeInput: React.FC<DateTimeInputProps> = ({
  date,
  time,
  showTimeInput,
  onDateChange,
  onTimeChange,
  onToggleTimeInput,
}) => {
  return (
    <div className="input-group">
      <div className="label-row-with-action">
        <label className="field-label">
          <Calendar size={16} /> Date
        </label>
        {!showTimeInput ? (
          <ActionButton
            icon={<Clock size={13} />}
            onClick={() => onToggleTimeInput(true)}
          >
            + Add time
          </ActionButton>
        ) : (
          <ActionButton
            onClick={() => {
              onToggleTimeInput(false)
              onTimeChange('')
            }}
          >
            Remove time
          </ActionButton>
        )}
      </div>

      {showTimeInput ? (
        <div className="datetime-row">
          <div className="half-col">
            <TextField
              icon={<Calendar size={16} />}
              type="date"
              required
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
            />
          </div>
          <div className="half-col">
            <TextField
              icon={<Clock size={16} />}
              type="time"
              placeholder="Select time"
              value={time}
              onChange={(e) => onTimeChange(e.target.value)}
            />
          </div>
        </div>
      ) : (
        <TextField
          icon={<Calendar size={16} />}
          type="date"
          required
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
        />
      )}

      <style jsx>{`
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .label-row-with-action {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .field-label {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 14px;
          color: var(--color-text);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .datetime-row {
          display: flex;
          gap: 12px;
        }

        .half-col {
          flex: 1;
        }
      `}</style>
    </div>
  )
}
