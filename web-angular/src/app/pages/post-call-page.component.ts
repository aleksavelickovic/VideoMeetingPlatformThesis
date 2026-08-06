import { Component, computed, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Download, LucideAngularModule, Plus, Users } from 'lucide-angular'
import { MeetingStateService } from '../core/meeting-state.service'
import { formatDuration, formatTime } from '../core/time.util'
import { SessionsHeaderComponent } from '../shared/sessions-header.component'

@Component({
  selector: 'app-post-call-page',
  imports: [RouterLink, SessionsHeaderComponent, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-page"><app-sessions-header />
      @if (summary(); as call) {<main class="mx-auto w-full max-w-[632px] px-5 py-9"><h1 class="text-2xl font-semibold text-white">Meeting Ended</h1><p class="mt-2 text-sm text-muted">{{ call.meeting?.title || 'Meeting summary' }}</p><div class="mt-8 grid grid-cols-3 gap-3"><div class="session-card p-4"><p class="text-xs text-muted">Duration</p><p class="mt-2 font-mono text-lg font-bold text-white">{{ duration() }}</p></div><div class="session-card p-4"><p class="text-xs text-muted">Participants joined</p><p class="mt-2 font-mono text-lg font-bold text-white">{{ joinedCount() }} / {{ participants().length }}</p></div><div class="session-card p-4"><p class="text-xs text-muted">Recording</p><p class="mt-2 font-mono text-lg font-bold" [class.text-success]="call.meeting?.recordingEnabled" [class.text-muted]="!call.meeting?.recordingEnabled">{{ call.meeting?.recording ? call.meeting?.recording?.height + 'p' : 'Off' }}</p></div></div>
        <section class="session-card mt-6 p-5"><h2 class="section-label border-b border-[#1c293d] pb-3">Participant activity</h2><div class="mt-3 divide-y divide-[#1c293d]">@for (participant of participants(); track participant.id) {<article class="flex items-center gap-3 py-3"><span class="grid size-8 place-items-center rounded-full border border-brand/40 bg-brand/10 text-[10px] font-semibold text-[#9bc2ff]">{{ initials(participant.name) }}</span><div class="min-w-0 flex-1"><p class="truncate text-sm font-semibold text-white">{{ participant.name }} @if (participant.role === 'host') {<small class="ml-1 text-[9px] text-amber">♛ HOST</small>}</p></div>@if (participant.joinedAt) {<div class="grid grid-cols-2 gap-3 text-right font-mono text-[10px] text-muted"><span>Joined<br><b class="font-normal text-[#a4bbdc]">{{ time(participant.joinedAt) }}</b></span><span>Left<br><b class="font-normal text-[#a4bbdc]">{{ time(participant.leftAt) }}</b></span></div>} @else {<span class="rounded border border-line px-2 py-1 text-[10px] text-muted">Did not join</span>}</article>}</div></section>
        <div class="mt-5 flex flex-wrap gap-3">@if (call.isHost && call.meeting?.recording?.presignedUrl) {<a [href]="call.meeting?.recording?.presignedUrl" download class="btn-secondary"><lucide-icon [img]="Download" class="size-4" />Download Recording</a>} @if (call.isHost) {@for (participant of participants(); track participant.id) {@if (participant.recordingPresignedUrl) {<a [href]="participant.recordingPresignedUrl" download class="btn-secondary"><lucide-icon [img]="Download" class="size-4" />{{ participant.name }} recording</a>}}}<a routerLink="/" class="btn-primary"><lucide-icon [img]="Plus" class="size-4" />New Meeting</a></div>
      </main>} @else {<main class="grid min-h-[calc(100vh-51px)] place-items-center p-6 text-center"><div><p class="text-lg text-white">No call summary is available.</p><a routerLink="/" class="btn-primary mt-5">New Meeting</a></div></main>}
    </div>
  `
})
export class PostCallPageComponent {
  private readonly state = inject(MeetingStateService); protected readonly summary = this.state.callSummary; readonly participants = computed(() => this.summary()?.meeting?.participants ?? []); readonly duration = computed(() => formatDuration(this.summary()?.durationSeconds ?? 0)); readonly joinedCount = computed(() => this.participants().filter(item => item.joinedAt).length); protected readonly Download = Download; protected readonly Plus = Plus; protected readonly Users = Users
  initials(value: string): string { return value.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase() }
  time(value: string | null): string { return formatTime(value) }
}
