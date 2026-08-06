import { Injectable, signal } from '@angular/core'
import { CallSummary, CreateMeetingResponse } from '../models/meeting.models'

const CREATED_KEY = 'sessions.created-meeting'
const SUMMARY_KEY = 'sessions.call-summary'

@Injectable({ providedIn: 'root' })
export class MeetingStateService {
  readonly created = signal<CreateMeetingResponse | null>(this.read<CreateMeetingResponse>(CREATED_KEY))
  readonly callSummary = signal<CallSummary | null>(this.read<CallSummary>(SUMMARY_KEY))
  setCreated(value: CreateMeetingResponse): void { this.created.set(value); sessionStorage.setItem(CREATED_KEY, JSON.stringify(value)) }
  setCallSummary(value: CallSummary): void { this.callSummary.set(value); sessionStorage.setItem(SUMMARY_KEY, JSON.stringify(value)) }
  clearCreated(): void { this.created.set(null); sessionStorage.removeItem(CREATED_KEY) }
  private read<T>(key: string): T | null { try { const value = sessionStorage.getItem(key); return value ? JSON.parse(value) as T : null } catch { return null } }
}
