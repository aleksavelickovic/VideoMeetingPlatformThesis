import {Component, OnDestroy, OnInit, computed, inject, signal} from '@angular/core'
import {ActivatedRoute, Router} from '@angular/router'
import {firstValueFrom} from 'rxjs'
import {LucideAngularModule, Mic, MicOff, MonitorUp, PhoneOff, Video, VideoOff} from 'lucide-angular'
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
            } @else {
                <div class="flex min-h-0 flex-1 flex-col">
                    <div class="flex items-center justify-between border-b border-[#1c283b] bg-[#101723] px-5 py-3">
                        <div class="text-xs text-muted">{{ title() || roomId }}</div>
                        <div class="flex items-center gap-4"><span
                                class="rounded border border-danger/30 bg-danger/10 px-2 py-1 text-[11px] font-bold text-danger"
                                [class.invisible]="!livekit.recording()">● REC</span><span
                                class="font-mono text-sm text-[#a6bfe5]"
                                [class.text-danger]="limitSeconds() && elapsed() >= limitSeconds()">{{ duration() }} @if (limitSeconds()) {
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
                                    <p class="mt-4 font-semibold text-white">Reconnecting…</p>
                                    <p class="mt-1 text-sm text-muted">Please wait while we restore your connection.</p>
                                </div>
                            </div>
                        }</main>
                    <footer class="flex shrink-0 items-center justify-center border-t border-[#1c283b] bg-[#0e141e] p-3">
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
                                    class="grid size-12 place-items-center rounded-xl bg-danger text-white transition hover:bg-[#e13e4a]"
                                    (click)="endCall()">
                                <lucide-icon [img]="PhoneOff" class="size-5"/>
                            </button>
                        </div>
                    </footer>
                </div>
            }
        </div>
    `,
    styles: `.toolbar {
        @apply grid size-12 place-items-center rounded-xl border border-line bg-field text-[#aac0e0] transition hover:border-brand hover:text-white;
    }

    .toolbar-danger {
        @apply border-danger/50 bg-danger/15 text-danger;
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
    private readonly identity = readJoinIdentity(this.token)
    readonly title = signal('');
    readonly elapsed = signal(0);
    readonly limitSeconds = signal(0);
    readonly muted = signal(false);
    readonly cameraOff = signal(false);
    readonly sharing = signal(false)
    readonly allParticipants = computed(() => [...(this.livekit.localParticipant() ? [this.livekit.localParticipant()!] : []), ...this.livekit.remoteParticipants()])
    readonly participantCount = computed(() => this.allParticipants().length)
    readonly duration = computed(() => formatDuration(this.elapsed()));
    readonly limitDuration = computed(() => formatDuration(this.limitSeconds()));
    readonly gridColumns = computed(() => `repeat(${this.participantCount() <= 1 ? 1 : this.participantCount() <= 4 ? 2 : this.participantCount() <= 9 ? 3 : 4}, minmax(0, 1fr))`)
    private timer?: ReturnType<typeof setInterval>;
    private leaving = false
    protected readonly Mic = Mic;
    protected readonly MicOff = MicOff;
    protected readonly MonitorUp = MonitorUp;
    protected readonly PhoneOff = PhoneOff;
    protected readonly Video = Video;
    protected readonly VideoOff = VideoOff

    async ngOnInit(): Promise<void> {
        if (!this.token) return
        this.api.getMeeting(this.roomId).subscribe({
            next: meeting => {
                this.title.set(meeting.title);
                this.limitSeconds.set(meeting.durationLimitMinutes * 60);
                const started = meeting.startedAt ? new Date(meeting.startedAt).getTime() : Date.now();
                this.elapsed.set(Math.max(0, Math.floor((Date.now() - started) / 1000)));
                this.timer = setInterval(() => this.elapsed.update(value => value + 1), 1000)
            }
        })
        const cameraEnabled = this.route.snapshot.queryParamMap.get('cameraEnabled') !== 'false'
        const microphoneEnabled = this.route.snapshot.queryParamMap.get('microphoneEnabled') !== 'false'
        this.cameraOff.set(!cameraEnabled)
        this.muted.set(!microphoneEnabled)
        await this.livekit.connect(this.token, this.route.snapshot.queryParamMap.get('name') || this.identity.name, this.route.snapshot.queryParamMap.get('camera') || undefined, this.route.snapshot.queryParamMap.get('microphone') || undefined, cameraEnabled, microphoneEnabled)
        this.livekit.room()?.on(RoomEvent.Disconnected, () => void this.finish())
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

    async endCall(): Promise<void> {
        if (this.identity.isHost) {
            try {
                await firstValueFrom(this.api.endMeeting(this.roomId))
            } catch {
            }
        }
        this.livekit.disconnect();
        await this.finish()
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
        if (!this.leaving) this.livekit.disconnect()
    }
}
