import {Component, inject, signal} from '@angular/core'
import {DatePipe} from '@angular/common'
import {FormsModule} from '@angular/forms'
import {LucideAngularModule, Save} from 'lucide-angular'
import {MeetingApiService} from '../core/meeting-api.service'
import {MeetingDto} from '../models/meeting.models'
import {SessionsHeaderComponent} from '../shared/sessions-header.component'

@Component({
    selector: 'app-my-meetings-page',
    imports: [FormsModule, DatePipe, SessionsHeaderComponent, LucideAngularModule],
    template: `
        <div class="min-h-screen bg-page">
            <app-sessions-header title="My meetings"/>
            <main class="mx-auto w-full max-w-4xl px-5 py-9"><h1 class="text-2xl font-semibold text-slate-900">My
                meetings</h1>
                <p class="mt-2 text-sm text-muted">Meetings created with your account.</p>@if (error()) {
                    <p class="mt-4 rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{{ error() }}</p>
                }
                <div class="mt-7 space-y-4">@for (meeting of meetings(); track meeting.roomId) {
                    <article class="session-card p-5">@if (editing() === meeting.roomId) {
                        <div class="grid gap-3 sm:grid-cols-2"><label><span class="field-label">Title</span><input
                                class="field-control" [(ngModel)]="draft.title"></label><label><span
                                class="field-label">Scheduled at</span><input type="datetime-local"
                                                                              class="field-control"
                                                                              [(ngModel)]="draft.scheduledAt"></label><label><span
                                class="field-label">Duration</span><input type="number" class="field-control"
                                                                          [(ngModel)]="draft.durationLimitMinutes"></label><label
                                class="flex items-center gap-2 pt-6"><input type="checkbox"
                                                                            [(ngModel)]="draft.recordingEnabled">
                            Recording enabled</label><label class="sm:col-span-2"><span
                                class="field-label">Description</span><textarea class="field-control"
                                                                                [(ngModel)]="draft.metadata"></textarea></label>
                        </div>
                        <div class="mt-4 flex gap-2">
                            <button class="btn-primary" (click)="save(meeting)">
                                <lucide-icon [img]="Save" class="mr-1 inline size-4"/>
                                Save
                            </button>
                            <button class="btn-secondary" (click)="editing.set(null)">Cancel</button>
                        </div>
                    } @else {
                        <div class="flex items-start justify-between gap-4">
                            <div><h2 class="text-lg font-semibold text-slate-900">{{ meeting.title }}</h2>
                                <p class="mt-1 text-xs text-muted">{{ meeting.status }}
                                    · {{ meeting.scheduledAt | date:'medium' }}</p>
                                <p class="mt-2 text-sm text-slate-600">{{ meeting.participants.length }} participants
                                    · {{ meeting.durationLimitMinutes }} min</p></div>
                            <button class="btn-secondary px-3 py-2 text-xs" (click)="edit(meeting)">Edit</button>
                        </div>
                    }</article>
                } @empty {
                    <div class="session-card p-8 text-center text-sm text-muted">You have not created any meetings
                        yet.
                    </div>
                }</div>
            </main>@if (blockedMeeting()) {
            <div class="fixed inset-0 z-40 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm"
                 (click)="closeBlockedModal()">
                <section class="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-2xl" role="dialog"
                         aria-modal="true" aria-labelledby="blocked-meeting-title" (click)="$event.stopPropagation()">
                    <h2 id="blocked-meeting-title" class="text-lg font-semibold text-slate-900">Editing not
                        possible</h2>
                    <p class="mt-3 text-sm leading-6 text-slate-600">Editing this meeting is not possible because the
                        meeting has already started, ended, canceled
                        or there are 15 minutes or less left until the start.</p>
                    <button class="btn-primary mt-5 w-full" (click)="closeBlockedModal()">Close</button>
                </section>
            </div>
        }</div>`
})
export class MyMeetingsPageComponent {
    private readonly api = inject(MeetingApiService)
    readonly meetings = signal<MeetingDto[]>([])
    readonly editing = signal<string | null>(null)
    readonly blockedMeeting = signal<MeetingDto | null>(null)
    readonly error = signal('')
    draft: any = {}
    protected readonly Save = Save

    constructor() {
        this.api.getMyMeetings().subscribe({
            next: value => this.meetings.set(value),
            error: e => this.error.set(e.error?.message || 'Could not load meetings.')
        })
    }

    edit(meeting: MeetingDto): void {
        if (!this.canEdit(meeting)) {
            this.blockedMeeting.set(meeting);
            return
        }
        this.editing.set(meeting.roomId);
        this.draft = {
            ...meeting,
            scheduledAt: new Date(meeting.scheduledAt).toISOString().slice(0, 16),
            metadata: meeting.metadata || '',
            recordingWidth: meeting.recording?.width || 1280,
            recordingHeight: meeting.recording?.height || 720
        }
    }

    save(meeting: MeetingDto): void {
        if (!this.canEdit(meeting) || !this.canEditScheduledAt(this.draft.scheduledAt)) {
            this.editing.set(null);
            this.blockedMeeting.set(meeting);
            return
        }
        this.api.updateMeeting(meeting.roomId, {
            ...this.draft,
            scheduledAt: new Date(this.draft.scheduledAt).toISOString()
        }).subscribe({
            next: value => {
                this.meetings.update(items => items.map(item => item.roomId === value.roomId ? value : item));
                this.editing.set(null)
            }, error: e => {
                if (e.status === 409) {
                    this.editing.set(null);
                    this.blockedMeeting.set(meeting);
                    return
                }
                this.error.set(e.error?.message || 'Could not update meeting.')
            }
        })
    }

    closeBlockedModal(): void {
        this.blockedMeeting.set(null)
    }

    private canEdit(meeting: MeetingDto): boolean {
        return meeting.status === 'scheduled' && this.canEditScheduledAt(meeting.scheduledAt)
    }

    private canEditScheduledAt(scheduledAt: string | null | undefined): boolean {
        return !!scheduledAt && new Date(scheduledAt).getTime() > Date.now() + 15 * 60 * 1000
    }
}
