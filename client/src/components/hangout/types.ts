import { HangoutMedia, HangoutNote, HangoutExpense, NoteType, MediaType } from '../../data/mock'

export type HangoutTab = 'overview' | 'media' | 'photos' | 'notes' | 'expenses'

export interface DebtSettlement {
  from: string
  to: string
  amount: number
}

export type { HangoutMedia, HangoutNote, HangoutExpense, NoteType, MediaType }
