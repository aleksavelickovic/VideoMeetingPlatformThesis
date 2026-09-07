import {Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, computed, inject, signal} from '@angular/core'
import {ActivatedRoute, Router} from '@angular/router'
import {firstValueFrom} from 'rxjs'
import {Bold, Italic, List, ListOrdered, LucideAngularModule, Mic, MicOff, MonitorUp, PhoneOff, Underline, Video, VideoOff, X} from 'lucide-angular'
import {RoomEvent} from 'livekit-client'
import {readJoinIdentity} from '../core/jwt.util'
import {LiveKitRoomService} from '../core/livekit-room.service'
import {MeetingApiService} from '../core/meeting-api.service'
import {MeetingStateService} from '../core/meeting-state.service'
import {formatDuration} from '../core/time.util'
import {SessionsHeaderComponent} from '../shared/sessions-header.component'
import {ParticipantTileComponent} from '../shared/participant-tile.component'

@Component({
    selector: 'app-in-call-page',
    imports: [SessionsHeaderComponent, ParticipantTileComponent, LucideAngularModule],
    template: `
        <div class="flex h-screen flex-col overflow-hidden bg-page">
            <app-sessions-header [title]="title()"/>
            @if (!token) {
                <main class="grid flex-1 place-items-center p-6 text-center">
                    <div><p class="text-lg text-danger">Missing join token.</p>
                        <button class="btn-primary mt-4" (click)="goHome()">Go back</button>
                    </div>
                </main>
            } @else if (livekit.error()) {
                <main class="grid flex-1 place-items-center p-6 text-center">
                    <div><p class="text-lg text-danger">Failed to connect to the call.</p>
                        <p class="mt-2 max-w-md text-sm text-muted">{{ livekit.error() }}</p>
                        <button class="btn-primary mt-5" (click)="goHome()">Go back</button>
                    </div>
                </main>
            } @else if (waiting()) {
                <main class="grid flex-1 place-items-center p-6 text-center">
                    <div><p class="text-lg font-semibold text-slate-900">Meeting has not started yet</p>
                        <p class="mt-2 text-sm text-muted">Starting in {{ countdownText() }}</p>
                    </div>
                </main>
            } @else {
                <div class="flex min-h-0 flex-1 flex-col">
                    <div class="flex items-center justify-between border-b border-line bg-white px-5 py-3">
                        <div class="text-xs text-muted">{{ title() || roomId }}</div>
                        <div class="flex items-center gap-4"><span
                                class="rounded border border-danger/30 bg-danger/10 px-2 py-1 text-[11px] font-bold text-danger"
                                [class.invisible]="!livekit.recording()">● REC</span><span
                                class="font-mono text-sm"
                                [class.text-slate-600]="limitSeconds() === 0 || remainingSeconds() > 300"
                                [class.text-amber]="remainingSeconds() > 60 && remainingSeconds() <= 300"
                                [class.text-danger]="limitSeconds() > 0 && remainingSeconds() <= 60">{{ duration() }} @if (limitSeconds()) {
                            / {{ limitDuration() }}
                        }</span><span class="text-xs text-muted">{{ participantCount() }} participants</span></div>
                    </div>
                    <main class="relative min-h-0 flex-1 p-3">
                        <div class="grid size-full gap-2"
                             [style.grid-template-columns]="gridColumns()">@for (participant of allParticipants(); track participant.identity) {
                            <app-participant-tile [participant]="participant"
                                                  [isLocal]="participant.identity === livekit.localParticipant()?.identity"/>
                        }</div>@if (!allParticipants().length) {
                        <div class="absolute inset-0 grid place-items-center text-sm text-muted">Connecting to
                            meeting…
                        </div>
                    }
                        @if (livekit.reconnecting()) {
                            <div class="absolute inset-0 z-10 grid place-items-center bg-page/85 text-center backdrop-blur">
                                <div><span
                                        class="mx-auto block size-10 animate-spin rounded-full border-4 border-line border-t-brand"></span>
                                    <p class="mt-4 font-semibold text-slate-900">Reconnecting…</p>
                                    <p class="mt-1 text-sm text-muted">Please wait while we restore your connection.</p>
                                </div>
                            </div>
                        }</main>
                    <footer class="flex shrink-0 items-center justify-center border-t border-line bg-white p-3">
                        <div class="flex items-center gap-3">
                            <button class="toolbar" [class.toolbar-danger]="muted()" (click)="toggleMute()">
                                <lucide-icon [img]="muted() ? MicOff : Mic" class="size-5"/>
                            </button>
                            <button class="toolbar" [class.toolbar-danger]="cameraOff()" (click)="toggleCamera()">
                                <lucide-icon [img]="cameraOff() ? VideoOff : Video" class="size-5"/>
                            </button>
                            <button class="toolbar" [class.toolbar-danger]="sharing()" (click)="toggleScreenShare()">
                                <lucide-icon [img]="MonitorUp" class="size-5"/>
                            </button>
                            <button
                                    class="grid size-12 place-items-center rounded-xl bg-danger text-white transition hover:bg-red-700"
                                    (click)="endCall()">
                                <lucide-icon [img]="PhoneOff" class="size-5"/>
                            </button>
                            @if (identity.isHost) {
                                <span class="mx-1 h-8 w-px bg-line"></span>
                                <button class="toolbar" [class.border-brand]="notesOpen()" [class.text-brand]="notesOpen()"
                                        (click)="notesOpen.update(value => !value)" title="Meeting notes">
                                    <span class="text-xs font-semibold">Notes</span>
                                </button>
                                <button class="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-xs font-semibold text-danger shadow-md shadow-red-100 transition hover:-translate-y-px hover:bg-danger/20"
                                        (click)="endMeeting()" title="End meeting for everyone">
                                    End meeting
                                </button>
                            }
                        </div>
                    </footer>
                </div>
            }
            @if (identity.isHost) {
                <div class="fixed inset-0 z-30 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm" [class.hidden]="!notesOpen()" (click)="closeNotes($event)">
                    <section class="notes-modal w-full max-w-xl rounded-2xl border border-line bg-white p-5 shadow-2xl" (click)="$event.stopPropagation()">
                        <div class="flex items-center justify-between">
                            <div><h2 class="text-lg font-semibold text-slate-900">Meeting notes</h2><p class="mt-1 text-xs text-muted">These notes will be emailed when the meeting ends.</p></div>
                            <button class="grid size-8 place-items-center rounded-lg text-muted hover:bg-blue-50 hover:text-brand" (click)="notesOpen.set(false)" aria-label="Close notes">
                                <lucide-icon [img]="X" class="size-4"/>
                            </button>
                        </div>
                        <div class="mt-4 overflow-hidden rounded-lg border border-line bg-field focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
                            <div class="flex flex-wrap items-center gap-1 border-b border-line bg-blue-50/70 px-2 py-1.5">
                                <button type="button" class="notes-format-button" [class.notes-format-active]="notesFormatting().bold" (mousedown)="formatNotes($event, 'bold')" aria-label="Bold"><lucide-icon [img]="Bold" class="size-4"/></button>
                                <button type="button" class="notes-format-button" [class.notes-format-active]="notesFormatting().italic" (mousedown)="formatNotes($event, 'italic')" aria-label="Italic"><lucide-icon [img]="Italic" class="size-4"/></button>
                                <button type="button" class="notes-format-button" [class.notes-format-active]="notesFormatting().underline" (mousedown)="formatNotes($event, 'underline')" aria-label="Underline"><lucide-icon [img]="Underline" class="size-4"/></button>
                                <span class="mx-1 h-5 w-px bg-line"></span>
                                <button type="button" class="grid size-8 place-items-center rounded text-slate-600 hover:bg-blue-100" (mousedown)="formatNotes($event, 'insertUnorderedList')"><lucide-icon [img]="List" class="size-4"/></button>
                                <button type="button" class="grid size-8 place-items-center rounded text-slate-600 hover:bg-blue-100" (mousedown)="formatNotes($event, 'insertOrderedList')"><lucide-icon [img]="ListOrdered" class="size-4"/></button>
                            </div>
                            <div #notesEditor contenteditable="true" role="textbox" aria-multiline="true" data-placeholder="Write notes about the meeting…"
                                 class="meeting-editor min-h-[220px] max-h-[45vh] overflow-y-auto px-3 py-3 text-sm text-slate-900 outline-none"
                                 (input)="syncNotes($event)" (keyup)="refreshNotesFormatting()" (mouseup)="refreshNotesFormatting()" (paste)="pasteNotesAsText($event)"></div>
                        </div>
                        <div class="mt-4 flex justify-end"><button class="rounded-lg border border-danger/40 bg-danger/10 px-4 py-2 text-sm font-semibold text-danger transition hover:bg-danger/20" (click)="clearNotes()">Clear</button></div>
                    </section>
                </div>
            }
        </div>
    `,
    styles: `.toolbar {
        @apply grid size-12 place-items-center rounded-xl border border-line bg-white text-slate-600 shadow-md shadow-slate-200/70 transition hover:-translate-y-px hover:border-brand hover:text-brand hover:shadow-lg;
    }

    .toolbar-danger {
        @apply border-danger/50 bg-danger/15 text-danger shadow-red-100;
    }`
})
export class InCallPageComponent implements OnInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    protected readonly livekit = inject(LiveKitRoomService);
    private readonly api = inject(MeetingApiService);
    private readonly state = inject(MeetingStateService)
    readonly roomId = this.route.snapshot.paramMap.get('roomId') ?? '';
    readonly token = this.route.snapshot.queryParamMap.get('token');
    readonly identity = readJoinIdentity(this.token)
    readonly title = signal('');
    readonly waiting = signal(false);
    readonly countdownSeconds = signal(0);
    readonly elapsed = signal(0);
    readonly limitSeconds = signal(0);
    readonly muted = signal(false);
    readonly cameraOff = signal(false);
    readonly sharing = signal(false)
    readonly notesOpen = signal(false)
    readonly notes = signal('')
    readonly notesFormatting = signal({bold: false, italic: false, underline: false})
    @ViewChild('notesEditor') private notesEditor?: ElementRef<HTMLElement>
    readonly allParticipants = computed(() => [...(this.livekit.localParticipant() ? [this.livekit.localParticipant()!] : []), ...this.livekit.remoteParticipants()])
    readonly participantCount = computed(() => this.allParticipants().length)
    readonly duration = computed(() => formatDuration(this.elapsed()));
    readonly limitDuration = computed(() => formatDuration(this.limitSeconds()));
    readonly remainingSeconds = computed(() => Math.max(0, this.limitSeconds() - this.elapsed()));
    readonly gridColumns = computed(() => `repeat(${this.participantCount() <= 1 ? 1 : this.participantCount() <= 4 ? 2 : this.participantCount() <= 9 ? 3 : 4}, minmax(0, 1fr))`)
    private timer?: ReturnType<typeof setInterval>;
    private countdownTimer?: ReturnType<typeof setInterval>;
    private leaving = false
    protected readonly Mic = Mic;
    protected readonly MicOff = MicOff;
    protected readonly MonitorUp = MonitorUp;
    protected readonly PhoneOff = PhoneOff;
    protected readonly Video = Video;
    protected readonly VideoOff = VideoOff
    protected readonly Bold = Bold;
    protected readonly Italic = Italic;
    protected readonly Underline = Underline;
    protected readonly List = List;
    protected readonly ListOrdered = ListOrdered
    protected readonly X = X

    async ngOnInit(): Promise<void> {
        if (!this.token) return
        await this.connectWhenAllowed()
    }

    private async connectWhenAllowed(): Promise<void> {
        const token = this.token
        if (!token) return
        let meeting;
        try {
            meeting = await firstValueFrom(this.api.getMeetingAccess(this.roomId))
        } catch {
            this.rejectAccess()
            return
        }
        this.title.set(meeting.title)
        this.limitSeconds.set(meeting.durationLimitMinutes * 60)
        const start = new Date(meeting.scheduledAt || meeting.startedAt || Date.now()).getTime()
        if (meeting.status === 'scheduled' && Date.now() < start) {
            this.startCountdown(Math.ceil((start - Date.now()) / 1000))
            return
        }
        const started = meeting.startedAt ? new Date(meeting.startedAt).getTime() : Date.now();
        this.elapsed.set(Math.max(0, Math.floor((Date.now() - started) / 1000)));
        this.timer = setInterval(() => this.elapsed.update(value => value + 1), 1000)
        const cameraEnabled = this.route.snapshot.queryParamMap.get('cameraEnabled') !== 'false'
        const microphoneEnabled = this.route.snapshot.queryParamMap.get('microphoneEnabled') !== 'false'
        this.cameraOff.set(!cameraEnabled)
        this.muted.set(!microphoneEnabled)
        await this.livekit.connect(token, this.route.snapshot.queryParamMap.get('name') || this.identity.name, this.route.snapshot.queryParamMap.get('camera') || undefined, this.route.snapshot.queryParamMap.get('microphone') || undefined, cameraEnabled, microphoneEnabled)
        this.livekit.room()?.on(RoomEvent.Disconnected, () => void this.finish())
    }

    private startCountdown(seconds: number): void {
        clearInterval(this.countdownTimer)
        this.waiting.set(true)
        this.countdownSeconds.set(seconds)
        this.countdownTimer = setInterval(() => {
            const value = this.countdownSeconds() - 1
            this.countdownSeconds.set(Math.max(0, value))
            if (value <= 0) {
                clearInterval(this.countdownTimer)
                this.waiting.set(false)
                void this.connectWhenAllowed()
            }
        }, 1000)
    }

    countdownText(): string {
        const total = this.countdownSeconds()
        const hours = Math.floor(total / 3600)
        const minutes = Math.floor((total % 3600) / 60)
        const seconds = total % 60
        return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` : `${minutes}:${String(seconds).padStart(2, '0')}`
    }

    private rejectAccess(): void {
        window.alert('It is not possible to access this meeting.')
        // void this.router.navigateByUrl('/')
    }

    async toggleMute(): Promise<void> {
        const participant = this.livekit.localParticipant();
        if (!participant) return;
        await participant.setMicrophoneEnabled(this.muted());
        this.muted.update(value => !value)
    }

    async toggleCamera(): Promise<void> {
        const participant = this.livekit.localParticipant();
        if (!participant) return;
        await participant.setCameraEnabled(this.cameraOff());
        this.cameraOff.update(value => !value)
    }

    async toggleScreenShare(): Promise<void> {
        const participant = this.livekit.localParticipant();
        if (!participant) return;
        await participant.setScreenShareEnabled(!this.sharing());
        this.sharing.update(value => !value)
    }

    @HostListener('window:keydown', ['$event'])
    handleKeyboardShortcut(event: KeyboardEvent): void {
        const target = event.target as HTMLElement | null
        if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
        if (!event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return
        if (event.key.toLowerCase() === 'c') {
            event.preventDefault()
            void this.toggleCamera()
        } else if (event.key.toLowerCase() === 'v') {
            event.preventDefault()
            void this.toggleMute()
        }
    }

    async endCall(): Promise<void> {
        this.livekit.disconnect();
        await this.finish()
    }

    async endMeeting(): Promise<void> {
        try {
            await firstValueFrom(this.api.endMeeting(this.roomId, this.notes() || null))
        } catch {
        }
        this.livekit.disconnect();
        await this.finish()
    }

    formatNotes(event: MouseEvent, command: string): void {
        event.preventDefault();
        document.execCommand(command, false);
        this.syncNotes(this.notesEditor?.nativeElement)
        this.refreshNotesFormatting()
    }

    syncNotes(source: Event | HTMLElement | undefined): void {
        const editor = source instanceof Event ? source.target as HTMLElement : source;
        if (editor) this.notes.set(editor.innerHTML.trim())
    }

    pasteNotesAsText(event: ClipboardEvent): void {
        event.preventDefault();
        document.execCommand('insertText', false, event.clipboardData?.getData('text/plain') ?? '')
        this.syncNotes(this.notesEditor?.nativeElement)
        this.refreshNotesFormatting()
    }

    refreshNotesFormatting(): void {
        this.notesFormatting.set({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline')
        })
    }

    closeNotes(event: MouseEvent): void {
        if (event.target === event.currentTarget) this.notesOpen.set(false)
    }

    clearNotes(): void {
        this.notes.set('')
        if (this.notesEditor) this.notesEditor.nativeElement.innerHTML = ''
    }

    private async finish(): Promise<void> {
        if (this.leaving) return;
        this.leaving = true;
        clearInterval(this.timer);
        let meeting = null;
        try {
            meeting = await firstValueFrom(this.api.getMeeting(this.roomId))
        } catch {
        }
        this.state.setCallSummary({
            roomId: this.roomId,
            durationSeconds: this.elapsed(),
            isHost: this.identity.isHost,
            meeting
        });
        await this.router.navigateByUrl('/post-call')
    }

    goHome(): void {
        this.router.navigateByUrl('/')
    }

    ngOnDestroy(): void {
        clearInterval(this.timer);
        clearInterval(this.countdownTimer);
        if (!this.leaving) this.livekit.disconnect()
    }
}
