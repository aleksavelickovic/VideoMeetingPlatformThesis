import {AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, computed, inject, signal} from '@angular/core'
import {FormsModule} from '@angular/forms'
import {ActivatedRoute, Router} from '@angular/router'
import {firstValueFrom} from 'rxjs'
import {Camera, ChevronDown, LucideAngularModule, Mic, UserRound, Video} from 'lucide-angular'
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
            <main class="mx-auto flex min-h-[calc(100vh-51px)] w-full max-w-[920px] items-center px-5 py-8">
                <div class="grid w-full items-center gap-7 md:grid-cols-[1.25fr_.8fr]">
                    <section>
                        <div
                                class="relative aspect-video overflow-hidden rounded-xl border border-[#24344c] bg-[#06101d] shadow-panel">
                            <video #preview autoplay muted playsinline class="size-full object-cover"
                                   [class.opacity-0]="!stream"></video>
                            <div class="absolute inset-0 grid place-items-center" [class.hidden]="stream"><span
                                    class="grid size-20 place-items-center rounded-full border-2 border-brand/60 bg-brand/10 text-2xl font-semibold text-[#9cc4ff]">{{ initials() }}</span><span
                                    class="absolute bottom-20 text-xs text-[#7294c3]">Camera preview</span></div>
                            <span
                                    class="absolute bottom-3 left-3 rounded bg-black/70 px-2 py-1 text-xs font-semibold text-white">{{ name() || 'You' }}</span>
                        </div>
                        <p class="mt-3 flex items-center gap-2 text-xs text-[#5c7ba5]">
                            <lucide-icon [img]="Mic" class="size-4"/>
                            {{ devices.loading() ? 'Detecting devices…' : 'Microphone active' }}
                        </p>
                    </section>
                    <section><h1 class="text-xl font-semibold text-white">Ready to join?</h1>
                        <p class="mt-1 text-sm text-muted">{{ meetingTitle() || 'Meeting' }}</p>
                        <div class="mt-6 space-y-4"><label><span class="field-label">Your name</span>
                            <div class="relative"><input [ngModel]="name()" (ngModelChange)="name.set($event)"
                                                         class="field-control pl-10">
                                <lucide-icon [img]="UserRound"
                                             class="pointer-events-none absolute left-3 top-3 size-4 text-muted"/>
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
                            <button class="btn-primary w-full" [disabled]="!token || !name().trim() || joining()"
                                    (click)="join()">{{ joining() ? 'Joining…' : 'Join Meeting' }}
                            </button>
                            <button class="btn-secondary w-full" (click)="back()">Back</button>
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
    stream: MediaStream | null = null
    protected readonly Camera = Camera;
    protected readonly ChevronDown = ChevronDown;
    protected readonly Mic = Mic;
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
        if (!this.cameraId()) return;
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
                    camera: this.cameraId(),
                    microphone: this.microphoneId()
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
