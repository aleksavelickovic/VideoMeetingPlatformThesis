import {Component, inject, signal} from '@angular/core'
import {DatePipe} from '@angular/common'
import {FormsModule} from '@angular/forms'
import {Check, LucideAngularModule, Monitor, X} from 'lucide-angular'
import {MeetingApiService} from '../core/meeting-api.service'
import {MeetingDto} from '../models/meeting.models'
import {SessionsHeaderComponent} from '../shared/sessions-header.component'
import {DateTimePickerComponent} from '../shared/date-time-picker.component'
import {RichTextEditorComponent} from '../shared/rich-text-editor.component'

const presets = [{label: 'HD (1280 × 720)', width: 1280, height: 720}, {
    label: 'Full HD (1920 × 1080)',
    width: 1920,
    height: 1080
}, {label: 'SD (854 × 480)', width: 854, height: 480}, {label: 'nHD (640 × 360)', width: 640, height: 360}]

@Component({
    selector: 'app-my-meetings-page',
    imports: [FormsModule, DatePipe, SessionsHeaderComponent, LucideAngularModule, DateTimePickerComponent, RichTextEditorComponent],
    template: `
        <div class="min-h-screen bg-page">
            <app-sessions-header title="My meetings"/>
            <main class="mx-auto w-full max-w-[632px] px-5 py-9 pb-14"><h1 class="text-2xl font-semibold tracking-tight text-slate-900">My
                meetings</h1>
                <p class="mt-2 text-sm text-muted">Meetings created with your account.</p>@if (error()) {
                    <p class="mt-4 rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{{ error() }}</p>
                }
                <div class="mt-7 space-y-4">@for (meeting of meetings(); track meeting.roomId) {
                    <article class="session-card p-5">
                        <div class="flex items-start justify-between gap-4">
                            <div><h2 class="text-lg font-semibold text-slate-900">{{ meeting.title }}</h2>
                                <p class="mt-1 text-xs text-muted">{{ meeting.status }}
                                    · {{ meeting.scheduledAt | date:'medium' }}</p>
                                <p class="mt-2 text-sm text-slate-600">{{ meeting.participants.length }} participants
                                    · {{ meeting.durationLimitMinutes }} min</p></div>
                            <div class="flex shrink-0 gap-2">
                                <button class="btn-secondary px-3 py-2 text-xs" (click)="edit(meeting)">Edit</button>
                                @if (meeting.status === 'scheduled') {
                                    <button class="btn-danger px-3 py-2 text-xs" (click)="requestCancellation(meeting)">Cancel Meeting</button>
                                }
                            </div>
                        </div>
                    </article>
                } @empty {
                    <div class="session-card p-8 text-center text-sm text-muted">You have not created any meetings
                        yet.
                    </div>
                }</div>
            </main>
            @if (editingMeeting(); as meeting) {
                <div class="fixed inset-0 z-40 grid place-items-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-5"
                     (click)="editing.set(null)">
                    <section class="edit-meeting-modal w-full max-w-3xl overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl"
                             role="dialog" aria-modal="true" aria-labelledby="edit-meeting-title" (click)="$event.stopPropagation()">
                        <div class="flex items-start justify-between border-b border-line bg-blue-50/70 px-5 py-4 sm:px-6">
                            <div>
                                <p class="section-label text-brand">Meeting settings</p>
                                <h2 id="edit-meeting-title" class="mt-1 text-xl font-semibold tracking-tight text-slate-900">Edit meeting</h2>
                                <p class="mt-1 text-xs text-muted">Update the details before confirming your changes.</p>
                            </div>
                            <button type="button" class="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-white hover:text-slate-900"
                                    aria-label="Close edit meeting dialog" (click)="editing.set(null)">
                                <lucide-icon [img]="X" class="size-5"/>
                            </button>
                        </div>
                        <div class="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
                            <section class="rounded-xl border border-line bg-white/70 p-4 sm:col-span-2">
                                <h3 class="section-label">Basic information</h3>
                                <label class="mt-3 block"><span class="field-label">Title</span><input class="field-control" [(ngModel)]="draft.title" placeholder="Q3 Product Review"></label>
                            </section>
                            <section class="rounded-xl border border-line bg-white/70 p-4">
                                <h3 class="section-label">Schedule</h3>
                                <div class="mt-3 space-y-3">
                                    <label class="block"><span class="field-label">Scheduled at</span><app-date-time-picker [(ngModel)]="draft.scheduledAt"/></label>
                                    <label class="block"><span class="field-label">Duration (minutes)</span><input type="number" min="1" max="480" [(ngModel)]="draft.durationLimitMinutes" class="field-control"></label>
                                </div>
                            </section>
                            <section class="rounded-xl border border-line bg-white/70 p-4">
                                <h3 class="section-label">Recording</h3>
                                <div class="mt-3 flex items-center justify-between rounded-lg bg-blue-50/70 px-3 py-2.5">
                                    <span class="text-sm font-medium text-slate-700">Enable recording</span>
                                    <button type="button" (click)="toggleRecording()" aria-label="Toggle recording"
                                            class="relative h-6 w-11 rounded-full transition" [class.bg-brand]="draft.recordingEnabled" [class.bg-slate-300]="!draft.recordingEnabled">
                                        <span class="absolute top-1 size-4 rounded-full bg-white shadow-sm transition" [class.left-1]="!draft.recordingEnabled" [class.left-6]="draft.recordingEnabled"></span>
                                    </button>
                                </div>
                                @if (draft.recordingEnabled) {
                                    <div class="mt-3 grid grid-cols-2 gap-2">
                                        <label class="col-span-2"><span class="field-label">Resolution preset</span><select class="field-control" [value]="recordingPreset()" (change)="selectPreset($event)">
                                            @for (preset of presets; track preset.label) { <option [value]="preset.width + 'x' + preset.height">{{ preset.label }}</option> }
                                            <option value="custom">Custom</option>
                                        </select></label>
                                        <label><span class="field-label">Width</span><input type="number" min="2" [(ngModel)]="draft.recordingWidth" class="field-control"></label>
                                        <label><span class="field-label">Height</span><input type="number" min="2" [(ngModel)]="draft.recordingHeight" class="field-control"></label>
                                    </div>
                                } @else {
                                    <p class="mt-3 text-xs text-muted">Recording is currently disabled.</p>
                                }
                                <div class="mt-2 flex items-center gap-2 text-xs text-muted"><lucide-icon [img]="Monitor" class="size-4"/>MP4 recording</div>
                            </section>
                            <section class="rounded-xl border border-line bg-white/70 p-4 sm:col-span-2">
                                <h3 class="section-label">Description <span class="font-normal normal-case tracking-normal">(optional)</span></h3>
                                <div class="mt-3"><app-rich-text-editor [(ngModel)]="draft.metadata"/></div>
                            </section>
                        </div>
                        <div class="flex flex-col-reverse gap-2 border-t border-line bg-slate-50/70 px-4 py-3 sm:flex-row sm:justify-end sm:px-5">
                            <button type="button" class="btn-secondary" (click)="editing.set(null)"><lucide-icon [img]="X" class="size-4"/>Cancel</button>
                            <button type="button" class="btn-primary" (click)="save(meeting)"><lucide-icon [img]="Check" class="size-4"/>Confirm changes</button>
                        </div>
                    </section>
                </div>
            }
            @if (blockedMeeting()) {
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
        }
        @if (cancellationTarget()) {
            <div class="fixed inset-0 z-40 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm"
                 (click)="closeCancellationModal()">
                <section class="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-2xl" role="dialog"
                         aria-modal="true" aria-labelledby="cancel-meeting-title" (click)="$event.stopPropagation()">
                    <h2 id="cancel-meeting-title" class="text-lg font-semibold text-slate-900">Cancel meeting?</h2>
                    <p class="mt-3 text-sm leading-6 text-slate-600">Are you sure you want to cancel <strong>{{ cancellationTarget()?.title }}</strong>? All participants will be notified by email and will no longer be able to join.</p>
                    <div class="mt-5 flex justify-end gap-2">
                        <button class="btn-secondary" [disabled]="cancelling()" (click)="closeCancellationModal()">No, keep it</button>
                        <button class="btn-danger" [disabled]="cancelling()" (click)="confirmCancellation()">{{ cancelling() ? 'Cancelling…' : 'Yes, cancel meeting' }}</button>
                    </div>
                </section>
            </div>
        }</div>`
})
export class MyMeetingsPageComponent {
    private readonly api = inject(MeetingApiService)
    readonly meetings = signal<MeetingDto[]>([])
    readonly editing = signal<string | null>(null)
    readonly blockedMeeting = signal<MeetingDto | null>(null)
    readonly cancellationTarget = signal<MeetingDto | null>(null)
    readonly cancelling = signal(false)
    readonly error = signal('')
    draft: any = {}
    readonly presets = presets
    protected readonly Check = Check
    protected readonly Monitor = Monitor
    protected readonly X = X

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
            recordingWidth: meeting.recordingWidth || meeting.recording?.width || 1280,
            recordingHeight: meeting.recordingHeight || meeting.recording?.height || 720
        }
    }

    toggleRecording(): void {
        this.draft.recordingEnabled = !this.draft.recordingEnabled
    }

    selectPreset(event: Event): void {
        const value = (event.target as HTMLSelectElement).value
        if (value === 'custom') return
        const [width, height] = value.split('x').map(Number)
        this.draft.recordingWidth = width
        this.draft.recordingHeight = height
    }

    editingMeeting(): MeetingDto | null {
        return this.meetings().find(meeting => meeting.roomId === this.editing()) || null
    }

    recordingPreset(): string {
        const preset = this.presets.find(item => item.width === Number(this.draft.recordingWidth) && item.height === Number(this.draft.recordingHeight))
        return preset ? `${preset.width}x${preset.height}` : 'custom'
    }

    save(meeting: MeetingDto): void {
        if (!this.canEdit(meeting) || !this.canEditScheduledAt(this.draft.scheduledAt)) {
            this.editing.set(null);
            this.blockedMeeting.set(meeting);
            return
        }
        this.api.updateMeeting(meeting.roomId, {
            title: this.draft.title?.trim() || '',
            scheduledAt: new Date(this.draft.scheduledAt).toISOString(),
            durationLimitMinutes: Number(this.draft.durationLimitMinutes),
            recordingEnabled: !!this.draft.recordingEnabled,
            recordingWidth: this.even(Number(this.draft.recordingWidth)),
            recordingHeight: this.even(Number(this.draft.recordingHeight)),
            metadata: this.draft.metadata?.trim() || null
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

    requestCancellation(meeting: MeetingDto): void {
        if (!this.canEdit(meeting)) {
            this.blockedMeeting.set(meeting)
            return
        }
        this.error.set('')
        this.cancellationTarget.set(meeting)
    }

    confirmCancellation(): void {
        const meeting = this.cancellationTarget()
        if (!meeting || this.cancelling()) return
        this.cancelling.set(true)
        this.api.cancelMeeting(meeting.roomId).subscribe({
            next: value => {
                this.meetings.update(items => items.map(item => item.roomId === value.roomId ? value : item))
                this.cancellationTarget.set(null)
                this.cancelling.set(false)
            }, error: e => {
                this.cancelling.set(false)
                this.cancellationTarget.set(null)
                if (e.status === 409) {
                    this.blockedMeeting.set(meeting)
                    return
                }
                this.error.set(e.error?.message || 'Could not cancel meeting.')
            }
        })
    }

    closeCancellationModal(): void {
        if (!this.cancelling()) this.cancellationTarget.set(null)
    }

    private even(value: number): number {
        return Math.max(2, Math.floor(value / 2) * 2)
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
