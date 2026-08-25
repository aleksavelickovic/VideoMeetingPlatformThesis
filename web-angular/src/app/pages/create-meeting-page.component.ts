import {Component, inject, signal} from '@angular/core'
import {FormArray, FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms'
import {Router} from '@angular/router'
import {finalize} from 'rxjs'
import {
    ChevronDown,
    FileUp,
    LucideAngularModule,
    Monitor,
    Plus,
    Trash2,
    UserRound,
    Video
} from 'lucide-angular'
import {MeetingApiService} from '../core/meeting-api.service'
import {MeetingStateService} from '../core/meeting-state.service'
import {CreateMeetingDto, ParticipantRole} from '../models/meeting.models'
import {DateTimePickerComponent} from '../shared/date-time-picker.component'
import {SessionsHeaderComponent} from '../shared/sessions-header.component'

const presets = [{label: 'HD (1280 × 720)', width: 1280, height: 720}, {
    label: 'Full HD (1920 × 1080)',
    width: 1920,
    height: 1080
}, {label: 'SD (854 × 480)', width: 854, height: 480}, {label: 'nHD (640 × 360)', width: 640, height: 360}]

@Component({
    selector: 'app-create-meeting-page',
    imports: [ReactiveFormsModule, DateTimePickerComponent, SessionsHeaderComponent, LucideAngularModule],
    template: `
        <div class="min-h-screen bg-page">
            <app-sessions-header/>
            <main class="mx-auto w-full max-w-[632px] px-5 py-9 pb-14">
                <h1 class="text-2xl font-semibold tracking-tight text-white">New Meeting</h1>
                <p class="mt-2 text-sm text-muted">Configure your meeting settings and participants.</p>

                <form [formGroup]="form" (ngSubmit)="submit()" class="mt-8 space-y-7">
                    <section class="session-card p-5"><h2 class="section-label border-b border-[#1c293d] pb-3">Basic
                        info</h2><label class="mt-4 block"><span class="field-label">Title</span><input
                            formControlName="title" class="field-control" placeholder="Q3 Product Review"></label>
                    </section>
                    <section class="session-card p-5"><h2 class="section-label border-b border-[#1c293d] pb-3">
                        Schedule</h2>
                        <div class="mt-4 grid gap-4 sm:grid-cols-[1fr_120px]"><label><span class="field-label">Scheduled at</span>
                            <app-date-time-picker formControlName="scheduledAt"/>
                        </label><label><span class="field-label">Duration (minutes)</span><input type="number" min="1"
                                                                                                 max="480"
                                                                                                 formControlName="durationLimitMinutes"
                                                                                                 class="field-control"></label>
                        </div>
                    </section>
                    <section class="session-card space-y-4 p-5"><h2
                            class="section-label border-b border-[#1c293d] pb-3">Connection</h2><label><span
                            class="field-label">Join Base URL</span><input formControlName="joinBaseUrl"
                                                                           class="field-control"></label><label><span
                            class="field-label">Callback URL</span><input formControlName="callbackUrl"
                                                                          class="field-control"
                                                                          placeholder="https://api.example.com/webhooks/meeting"></label>
                    </section>
                    <section class="session-card p-5">
                        <div class="flex items-center justify-between border-b border-[#1c293d] pb-3"><h2
                                class="section-label">Additional Metadata (optional)</h2><label
                                class="flex cursor-pointer items-center gap-1 text-xs text-[#86a5d2]">
                            <lucide-icon [img]="FileUp" class="size-3.5"/>
                            Import JSON<input type="file" accept="application/json,.json" class="hidden"
                                              (change)="importJson($event)"></label></div>
                        <label class="mt-4 block"><span class="field-label">JSON Payload</span><textarea
                                formControlName="metadata" rows="4" class="field-control resize-y font-mono text-xs"
                                placeholder='{"department":"engineering"}'></textarea></label></section>
                    <section class="session-card p-5">
                        <div class="flex items-center justify-between border-b border-[#1c293d] pb-3"><h2
                                class="section-label">Participants</h2>
                            <button type="button" class="text-xs text-[#86a5d2] hover:text-white"
                                    (click)="addParticipant()">
                                <lucide-icon [img]="Plus" class="mr-1 inline size-3.5"/>
                                Add participant
                            </button>
                        </div>
                        <div formArrayName="participants"
                             class="mt-4 space-y-2">@for (participant of participants.controls; track $index) {
                            <div [formGroupName]="$index"
                                 class="grid grid-cols-[34px_minmax(0,1fr)_72px_24px] items-center gap-2"><span
                                    class="grid size-7 place-items-center rounded-full border border-brand/40 bg-brand/10 text-[10px] font-semibold text-[#83b2ff]">{{ initials(participant.value.name) }}</span><input
                                    formControlName="name" class="field-control py-2" placeholder="Participant name">
                                <button type="button" (click)="makeHost($index)"
                                        class="rounded-md border px-2 py-2 text-[10px] font-bold"
                                        [class.border-amber]="participant.value.role === 'host'"
                                        [class.text-amber]="participant.value.role === 'host'"
                                        [class.border-line]="participant.value.role !== 'host'"
                                        [class.text-muted]="participant.value.role !== 'host'">♛ HOST
                                </button>
                                <button type="button" [disabled]="participants.length <= 2"
                                        (click)="removeParticipant($index)"
                                        class="text-muted hover:text-danger disabled:opacity-30">
                                    <lucide-icon [img]="Trash2" class="size-4"/>
                                </button>
                            </div>
                        }</div>
                    </section>
                    <section class="session-card p-5"><h2 class="section-label border-b border-[#1c293d] pb-3">
                        Recording</h2>
                        <div class="mt-4 flex items-center justify-between"><span class="text-sm text-[#9eb4d5]">Enable recording</span>
                            <button type="button" (click)="toggleRecording()"
                                    class="relative h-6 w-11 rounded-full transition"
                                    [class.bg-brand]="recordingEnabled" [class.bg-[#263653]]="!recordingEnabled"><span
                                    class="absolute top-1 size-4 rounded-full bg-white transition"
                                    [class.left-1]="!recordingEnabled" [class.left-6]="recordingEnabled"></span>
                            </button>
                        </div>@if (recordingEnabled) {
                            <div class="mt-4 grid gap-3 sm:grid-cols-3"><label class="sm:col-span-3"><span
                                    class="field-label">Resolution preset</span><select class="field-control"
                                                                                        (change)="selectPreset($event)">@for (preset of presets; track preset.label) {
                                <option [value]="preset.width + 'x' + preset.height">{{ preset.label }}</option>
                            }
                                <option value="custom">Custom</option>
                            </select></label><label><span class="field-label">Width</span><input type="number"
                                                                                                 formControlName="recordingWidth"
                                                                                                 class="field-control"></label><label><span
                                    class="field-label">Height</span><input type="number"
                                                                            formControlName="recordingHeight"
                                                                            class="field-control"></label>
                                <div class="flex items-end">
                                    <lucide-icon [img]="Monitor" class="mb-3 size-5 text-muted"/>
                                    <span class="mb-3 ml-2 text-xs text-muted">MP4</span></div>
                            </div>
                        }</section>
                    @if (error()) {
                        <p class="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-[#ff9fa7]">{{ error() }}</p>
                    }
                    <button type="submit" [disabled]="loading()"
                            class="btn-primary w-full">{{ loading() ? 'Creating…' : 'Create Meeting' }}
                    </button>
                </form>
            </main>
        </div>
    `
})
export class CreateMeetingPageComponent {
    private readonly fb = inject(FormBuilder);
    private readonly api = inject(MeetingApiService);
    private readonly state = inject(MeetingStateService);
    private readonly router = inject(Router)
    readonly loading = signal(false);
    readonly error = signal('');
    readonly presets = presets
    readonly form = this.fb.group({
        title: ['', [Validators.required, Validators.maxLength(200)]],
        scheduledAt: ['', Validators.required],
        durationLimitMinutes: [60, [Validators.required, Validators.min(1), Validators.max(480)]],
        joinBaseUrl: [window.location.origin, Validators.required],
        callbackUrl: ['', Validators.required],
        metadata: [''],
        recordingWidth: [1280, [Validators.min(1)]],
        recordingHeight: [720, [Validators.min(1)]],
        participants: this.fb.array([this.participant('host'), this.participant('guest'), this.participant('guest')])
    })
    recordingEnabled = false
    protected readonly FileUp = FileUp;
    protected readonly Plus = Plus;
    protected readonly Trash2 = Trash2;
    protected readonly Monitor = Monitor

    get participants(): FormArray {
        return this.form.controls.participants
    }

    private participant(role: ParticipantRole) {
        return this.fb.group({name: ['', Validators.required], role: [role]})
    }

    initials(value: string | null | undefined): string {
        return value?.trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase() || '…'
    }

    addParticipant(): void {
        if (this.participants.length < 6) this.participants.push(this.participant('guest'))
    }

    removeParticipant(index: number): void {
        if (this.participants.length > 2) {
            this.participants.removeAt(index);
            if (!this.participants.controls.some(item => item.value.role === 'host')) this.makeHost(0)
        }
    }

    makeHost(index: number): void {
        this.participants.controls.forEach((item, itemIndex) => item.get('role')?.setValue(itemIndex === index ? 'host' : 'guest'))
    }

    toggleRecording(): void {
        this.recordingEnabled = !this.recordingEnabled
    }

    selectPreset(event: Event): void {
        const value = (event.target as HTMLSelectElement).value;
        if (value === 'custom') return;
        const [width, height] = value.split('x').map(Number);
        this.form.controls.recordingWidth.setValue(width);
        this.form.controls.recordingHeight.setValue(height)
    }

    importJson(event: Event): void {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        file.text().then(text => {
            JSON.parse(text);
            this.form.controls.metadata.setValue(JSON.stringify(JSON.parse(text), null, 2));
            this.error.set('')
        }).catch(() => this.error.set('The selected file is not valid JSON.'))
    }

    submit(): void {
        this.error.set('');
        this.form.markAllAsTouched();
        const data = this.form.getRawValue();
        const participants = data.participants.map(item => ({
            name: item.name?.trim() ?? '',
            role: item.role as ParticipantRole
        }));
        const hostCount = participants.filter(item => item.role === 'host').length
        if (this.form.invalid || hostCount !== 1 || participants.some(item => !item.name) || !this.absoluteUrl(data.joinBaseUrl) || !this.absoluteUrl(data.callbackUrl)) {
            this.error.set('Complete all required fields with a future date, valid URLs, and exactly one host.');
            return
        }
        const scheduledAt = new Date(data.scheduledAt as string);
        if (Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
            this.error.set('Scheduled date and time must be in the future.');
            return
        }
        let metadata: unknown = null;
        const rawMetadata = data.metadata?.trim() ?? '';
        if (rawMetadata) {
            try {
                metadata = JSON.parse(rawMetadata)
            } catch {
                metadata = rawMetadata
            }
        }
        const dto: CreateMeetingDto = {
            title: data.title?.trim() ?? '',
            scheduledAt: scheduledAt.toISOString(),
            durationLimitMinutes: Number(data.durationLimitMinutes),
            participants,
            recording: {
                enabled: this.recordingEnabled,
                format: 'mp4',
                width: this.even(Number(data.recordingWidth)),
                height: this.even(Number(data.recordingHeight))
            },
            callbackUrl: data.callbackUrl?.trim() ?? '',
            joinBaseUrl: data.joinBaseUrl?.trim() ?? '',
            metadata
        }
        this.loading.set(true);
        this.api.createMeeting(dto).pipe(finalize(() => this.loading.set(false))).subscribe({
            next: result => {
                this.state.setCreated(result);
                this.router.navigateByUrl('/meeting-created')
            }, error: error => this.error.set(error.error?.message || error.message || 'Meeting could not be created.')
        })
    }

    private absoluteUrl(value: string | null): boolean {
        try {
            const url = new URL(value ?? '');
            return Boolean(url.protocol && url.host)
        } catch {
            return false
        }
    }

    private even(value: number): number {
        return Math.max(2, Math.floor(value / 2) * 2)
    }
}
