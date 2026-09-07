import {AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, computed, inject, signal} from '@angular/core'
import {FormsModule} from '@angular/forms'
import {ActivatedRoute, Router} from '@angular/router'
import {firstValueFrom} from 'rxjs'
import {Camera, CameraOff, ChevronDown, LucideAngularModule, Mic, MicOff, UserRound, Video} from 'lucide-angular'
import {readJoinIdentity} from '../core/jwt.util'
import {MediaDevicesService} from '../core/media-devices.service'
import {MeetingApiService} from '../core/meeting-api.service'
import {MeetingDto} from '../models/meeting.models'
import {SessionsHeaderComponent} from '../shared/sessions-header.component'

@Component({
    selector: 'app-pre-join-page',
    imports: [FormsModule, SessionsHeaderComponent, LucideAngularModule],
    template: `
        <div class="min-h-screen bg-page">
            <app-sessions-header [title]="meetingTitle()"/>
            <main class="mx-auto flex min-h-[calc(100vh-51px)] w-full max-w-[1360px] items-center px-5 py-8">
                <div class="grid w-full items-stretch gap-8 md:grid-cols-[minmax(0,1fr)_374px]">
                    <section class="relative h-full min-h-[320px] rounded-2xl border border-blue-100 bg-white/70 p-2 shadow-preview ring-1 ring-white/80">
                        <div
                                class="absolute inset-2 overflow-hidden rounded-xl border border-blue-200 bg-slate-200 shadow-lg shadow-blue-200/60">
                            <video #preview autoplay muted playsinline class="size-full object-cover"
                                   [class.opacity-0]="!previewStream()"></video>
                            <div class="absolute inset-0 grid place-items-center" [class.hidden]="previewStream()"><span
                                    class="grid size-20 place-items-center rounded-full border-2 border-brand/60 bg-brand/10 text-2xl font-semibold text-blue-700">{{ initials() }}</span><span
                                    class="absolute bottom-20 text-xs text-slate-500">Camera preview</span></div>
                            <span
                                    class="absolute bottom-3 left-3 rounded bg-black/70 px-2 py-1 text-xs font-semibold text-white">{{ name() || 'You' }}</span>
                            <span class="absolute bottom-3 right-3 flex items-center gap-1 rounded bg-black/70 px-2 py-1 text-xs text-white">
                                <lucide-icon [img]="microphoneEnabled() ? Mic : MicOff" class="size-3.5"/>
                                {{ microphoneEnabled() ? 'Microphone on' : 'Microphone off' }}
                            </span>
                        </div>
                    </section>
                    <section class="flex h-full flex-col rounded-2xl border border-line bg-white/80 p-6 shadow-panel backdrop-blur-sm"><h1 class="text-xl font-semibold text-slate-900">Ready to join?</h1>
                        <p class="mt-1 text-sm text-muted">{{ meetingTitle() || 'Meeting' }}</p>
                        @if (countdownSeconds() > 0) {
                            <div class="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-3 text-center text-sm text-blue-800">
                                Meeting starts in <strong>{{ countdownText() }}</strong>
                            </div>
                        }
                        @if (countdownTarget()) {
                            <label class="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-slate-50 p-3 transition hover:border-brand hover:bg-blue-50">
                                <input type="checkbox" class="mt-0.5 size-4 accent-blue-600" [checked]="autoJoin()"
                                       (change)="setAutoJoin($any($event.target).checked)">
                                <span><span class="block text-sm font-medium text-slate-800">Join automatically when the meeting starts</span>
                                    <span class="mt-1 block text-xs text-muted">You can still join manually when the countdown ends.</span></span>
                            </label>
                        }
                        <div class="mt-6 flex flex-1 flex-col justify-between space-y-4"><label><span class="field-label">Your name</span>
                            <div class="relative"><input [ngModel]="name()" (ngModelChange)="name.set($event)"
                                                         class="field-control pl-10">
<!--                                <lucide-icon [img]="UserRound"-->
<!--                                             class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"/>-->
                            </div>
                        </label><label><span class="field-label">Camera</span>
                            <div class="relative"><select [ngModel]="cameraId()"
                                                          (ngModelChange)="cameraId.set($event); updatePreview()"
                                                          class="field-control appearance-none pr-9">@if (devices.loading()) {
                                <option>Detecting…</option>
                            }
                                @for (device of devices.cameras(); track device.deviceId) {
                                    <option [value]="device.deviceId">{{ device.label }}</option>
                                }</select>
                                <lucide-icon [img]="ChevronDown"
                                             class="pointer-events-none absolute right-3 top-3 size-4 text-muted"/>
                            </div>
                        </label><label><span class="field-label">Microphone</span>
                            <div class="relative"><select [ngModel]="microphoneId()"
                                                          (ngModelChange)="microphoneId.set($event)"
                                                          class="field-control appearance-none pr-9">@if (devices.loading()) {
                                <option>Detecting…</option>
                            }
                                @for (device of devices.microphones(); track device.deviceId) {
                                    <option [value]="device.deviceId">{{ device.label }}</option>
                                }</select>
                                <lucide-icon [img]="ChevronDown"
                                             class="pointer-events-none absolute right-3 top-3 size-4 text-muted"/>
                            </div>
                        </label>@if (devices.error()) {
                            <p class="text-xs text-danger">{{ devices.error() }}</p>
                        }
                            @if (error()) {
                                <p class="text-xs text-danger">{{ error() }}</p>
                            }
                            <div class="grid grid-cols-2 gap-3">
                                <button type="button" class="btn-secondary flex items-center justify-center gap-2"
                                        [class.border-brand]="cameraEnabled()" [class.bg-blue-50]="cameraEnabled()" [class.text-brand]="cameraEnabled()"
                                        (click)="toggleCamera()">
                                    <lucide-icon [img]="cameraEnabled() ? Camera : CameraOff" class="size-4"/>
                                    {{ cameraEnabled() ? 'Camera on' : 'Camera off' }}
                                </button>
                                <button type="button" class="btn-secondary flex items-center justify-center gap-2"
                                        [class.border-brand]="microphoneEnabled()" [class.bg-blue-50]="microphoneEnabled()" [class.text-brand]="microphoneEnabled()"
                                        (click)="toggleMicrophone()">
                                    <lucide-icon [img]="microphoneEnabled() ? Mic : MicOff" class="size-4"/>
                                    {{ microphoneEnabled() ? 'Mic on' : 'Mic off' }}
                                </button>
                            </div>
                            <button class="btn-primary w-full" [disabled]="!token || !name().trim() || joining() || countdownSeconds() > 0"
                                    (click)="join()">{{ joining() ? 'Joining…' : countdownSeconds() > 0 ? 'Waiting for meeting…' : 'Join Meeting' }}
                            </button>
<!--                            <button class="btn-secondary w-full" (click)="back()">Back</button>-->
                        </div>
                    </section>
                </div>
            </main>
        </div>
    `
})
export class PreJoinPageComponent implements AfterViewInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    protected readonly devices = inject(MediaDevicesService);
    private readonly api = inject(MeetingApiService)
    @ViewChild('preview') private preview?: ElementRef<HTMLVideoElement>
    readonly token = this.route.snapshot.queryParamMap.get('token');
    readonly roomId = this.route.snapshot.paramMap.get('roomId') ?? ''
    readonly name = signal(readJoinIdentity(this.token).name);
    readonly cameraId = signal('');
    readonly microphoneId = signal('');
    readonly meetingTitle = signal('');
    readonly error = signal('');
    readonly joining = signal(false)
    readonly countdownSeconds = signal(0)
    readonly countdownTarget = signal<number | null>(null)
    readonly autoJoin = signal(false)
    readonly cameraEnabled = signal(true)
    readonly microphoneEnabled = signal(true)
    readonly previewStream = signal<MediaStream | null>(null)
    private previewRequest = 0
    private countdownTimer?: ReturnType<typeof setInterval>
    protected readonly Camera = Camera;
    protected readonly CameraOff = CameraOff;
    protected readonly ChevronDown = ChevronDown;
    protected readonly Mic = Mic;
    protected readonly MicOff = MicOff;
    protected readonly UserRound = UserRound;
    protected readonly Video = Video

    async ngAfterViewInit(): Promise<void> {
        await this.devices.enumerate();
        this.cameraId.set(this.devices.cameras()[0]?.deviceId ?? '');
        this.microphoneId.set(this.devices.microphones()[0]?.deviceId ?? '');
        await this.updatePreview();
        this.api.getMeeting(this.roomId).subscribe({
            next: result => {
                this.meetingTitle.set(result.title)
                this.prepareAccess(result)
            },
            error: () => this.error.set('Could not load the meeting.')
        })
    }

    private prepareAccess(meeting: MeetingDto): void {
        const start = new Date(meeting.scheduledAt || meeting.startedAt || Date.now()).getTime()
        const end = start + meeting.durationLimitMinutes * 60_000
        const now = Date.now()
        const isInProgress = meeting.status === 'in_progress' && now >= start && now < end
        const isScheduledBeforeStart = meeting.status === 'scheduled' && now < start
        if (isInProgress) return
        if (isScheduledBeforeStart) this.startCountdown(start)
    }

    private startCountdown(target: number): void {
        clearInterval(this.countdownTimer)
        this.countdownTarget.set(target)
        this.updateCountdown(target)
        this.countdownTimer = setInterval(() => {
            this.updateCountdown(target)
            if (this.countdownSeconds() <= 0) {
                clearInterval(this.countdownTimer)
                if (this.autoJoin()) void this.join()
            }
        }, 1000)
    }

    private updateCountdown(target: number): void {
        this.countdownSeconds.set(Math.max(0, Math.ceil((target - Date.now()) / 1000)))
    }

    countdownText(): string {
        const target = this.countdownTarget()
        if (!target) return '00:00:00'
        let cursor = new Date()
        const end = new Date(target)
        let years = 0
        while (this.addYears(cursor, years + 1) <= end) years++
        cursor = this.addYears(cursor, years)
        let months = 0
        while (this.addMonths(cursor, months + 1) <= end) months++
        cursor = this.addMonths(cursor, months)
        const days = Math.floor((end.getTime() - cursor.getTime()) / 86_400_000)
        cursor = new Date(cursor.getTime() + days * 86_400_000)
        const hours = Math.floor((end.getTime() - cursor.getTime()) / 3_600_000)
        cursor = new Date(cursor.getTime() + hours * 3_600_000)
        const minutes = Math.floor((end.getTime() - cursor.getTime()) / 60_000)
        const seconds = Math.max(0, Math.floor((end.getTime() - cursor.getTime() - minutes * 60_000) / 1000))
        const time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        if (years > 0) return `${years} year${years === 1 ? '' : 's'} ${months} month${months === 1 ? '' : 's'} ${days} day${days === 1 ? '' : 's'} ${time}`
        if (months > 0) return `${months} month${months === 1 ? '' : 's'} ${days} day${days === 1 ? '' : 's'} ${time}`
        if (days > 0) return `${days} day${days === 1 ? '' : 's'} ${time}`
        return time
    }

    setAutoJoin(value: boolean): void {
        this.autoJoin.set(value)
        if (value && this.countdownTarget() && this.countdownSeconds() <= 0) void this.join()
    }

    private addMonths(value: Date, months: number): Date {
        const result = new Date(value)
        const day = result.getDate()
        result.setDate(1)
        result.setMonth(result.getMonth() + months)
        result.setDate(Math.min(day, new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate()))
        return result
    }

    private addYears(value: Date, years: number): Date {
        const result = new Date(value)
        const month = result.getMonth()
        const day = result.getDate()
        result.setDate(1)
        result.setFullYear(result.getFullYear() + years)
        result.setMonth(month)
        result.setDate(Math.min(day, new Date(result.getFullYear(), month + 1, 0).getDate()))
        return result
    }

    async updatePreview(): Promise<void> {
        const request = ++this.previewRequest
        this.previewStream()?.getTracks().forEach(track => track.stop());
        this.previewStream.set(null)
        if (!this.cameraEnabled() || !this.cameraId()) {
            this.clearPreview()
            return
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {deviceId: {exact: this.cameraId()}},
                audio: false
            });
            if (request !== this.previewRequest || !this.cameraEnabled()) {
                stream.getTracks().forEach(track => track.stop())
                return
            }
            this.previewStream.set(stream)
            await this.attachPreview(stream)
        } catch {
            if (request !== this.previewRequest) return
            this.previewStream.set(null)
            this.clearPreview()
        }
    }

    private clearPreview(): void {
        if (!this.preview) return
        const video = this.preview.nativeElement
        video.pause()
        video.srcObject = null
        video.load()
    }

    private async attachPreview(stream: MediaStream): Promise<void> {
        if (!this.preview) return
        const video = this.preview.nativeElement
        video.srcObject = stream
        try {
            await video.play()
        } catch {
            if (video.srcObject === stream) this.previewStream.set(null)
        }
    }

    async toggleCamera(): Promise<void> {
        this.cameraEnabled.update(value => !value)
        await this.updatePreview()
    }

    toggleMicrophone(): void {
        this.microphoneEnabled.update(value => !value)
    }

    initials(): string {
        return this.name().trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'YO'
    }

    async join(): Promise<void> {
        if (!this.token) return;
        this.joining.set(true);
        this.error.set('');
        try {
            const meeting = await firstValueFrom(this.api.getMeetingAccess(this.roomId));
            if (meeting.status === 'scheduled' && meeting.scheduledAt && Date.now() < new Date(meeting.scheduledAt).getTime()) {
                return
            }
            await this.router.navigate(['/call', this.roomId], {
                queryParams: {
                    token: this.token,
                    name: this.name(),
                    camera: this.cameraEnabled() ? this.cameraId() : '',
                    microphone: this.microphoneEnabled() ? this.microphoneId() : '',
                    cameraEnabled: String(this.cameraEnabled()),
                    microphoneEnabled: String(this.microphoneEnabled())
                }
            })
        } catch (error) {
            this.rejectAccess()
        } finally {
            this.joining.set(false)
        }
    }

    private rejectAccess(): void {
        clearInterval(this.countdownTimer)
        window.alert('It is not possible to access this meeting.')
    }

    back(): void {
        this.router.navigateByUrl('/create-meeting')
    }

    ngOnDestroy(): void {
        clearInterval(this.countdownTimer)
        this.previewRequest++
        this.clearPreview()
        this.previewStream()?.getTracks().forEach(track => track.stop())
    }
}
