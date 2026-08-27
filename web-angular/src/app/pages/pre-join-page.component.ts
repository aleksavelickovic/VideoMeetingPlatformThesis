import {AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, computed, inject, signal} from '@angular/core'
import {FormsModule} from '@angular/forms'
import {ActivatedRoute, Router} from '@angular/router'
import {firstValueFrom} from 'rxjs'
import {Camera, CameraOff, ChevronDown, LucideAngularModule, Mic, MicOff, UserRound, Video} from 'lucide-angular'
import {readJoinIdentity} from '../core/jwt.util'
import {MediaDevicesService} from '../core/media-devices.service'
import {MeetingApiService} from '../core/meeting-api.service'
import {SessionsHeaderComponent} from '../shared/sessions-header.component'

@Component({
    selector: 'app-pre-join-page',
    imports: [FormsModule, SessionsHeaderComponent, LucideAngularModule],
    template: `
        <div class="min-h-screen bg-page">
            <app-sessions-header [title]="meetingTitle()"/>
            <main class="mx-auto flex min-h-[calc(100vh-51px)] w-full max-w-[1360px] items-center px-5 py-8">
                <div class="grid w-full items-stretch gap-8 md:grid-cols-[minmax(0,1fr)_374px]">
                    <section class="h-full rounded-2xl border border-blue-100 bg-white/70 p-2 shadow-preview ring-1 ring-white/80 md:flex md:justify-center">
                        <div
                                class="relative aspect-video h-full overflow-hidden rounded-xl border border-blue-200 bg-slate-200 shadow-lg shadow-blue-200/60 md:inline-block md:w-auto">
                            <video #preview autoplay muted playsinline class="size-full object-cover"
                                   [class.opacity-0]="!stream"></video>
                            <div class="absolute inset-0 grid place-items-center" [class.hidden]="stream"><span
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
                            <button class="btn-primary w-full" [disabled]="!token || !name().trim() || joining()"
                                    (click)="join()">{{ joining() ? 'Joining…' : 'Join Meeting' }}
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
    readonly cameraEnabled = signal(true)
    readonly microphoneEnabled = signal(true)
    stream: MediaStream | null = null
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
        this.api.getMeeting(this.roomId).subscribe({next: result => this.meetingTitle.set(result.title)})
    }

    async updatePreview(): Promise<void> {
        this.stream?.getTracks().forEach(track => track.stop());
        this.stream = null
        if (!this.cameraEnabled() || !this.cameraId()) {
            if (this.preview) this.preview.nativeElement.srcObject = null
            return
        }
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {deviceId: {exact: this.cameraId()}},
                audio: false
            });
            if (this.preview) this.preview.nativeElement.srcObject = this.stream
        } catch {
            this.stream = null
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
            const meeting = await firstValueFrom(this.api.getMeeting(this.roomId));
            if (meeting.status !== 'scheduled' && meeting.status !== 'in_progress') throw new Error('This meeting has already ended.');
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
            this.error.set(error instanceof Error ? error.message : 'Could not verify the meeting.')
        } finally {
            this.joining.set(false)
        }
    }

    back(): void {
        this.router.navigateByUrl('/')
    }

    ngOnDestroy(): void {
        this.stream?.getTracks().forEach(track => track.stop())
    }
}
