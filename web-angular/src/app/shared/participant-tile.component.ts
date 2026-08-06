import { AfterViewChecked, Component, ElementRef, OnDestroy, ViewChild, input } from '@angular/core'
import { LocalParticipant, Participant, RemoteParticipant, Track } from 'livekit-client'
import { LucideAngularModule, MicOff, Monitor } from 'lucide-angular'

@Component({
  selector: 'app-participant-tile',
  imports: [LucideAngularModule],
  template: `
    <article class="relative h-full min-h-0 overflow-hidden rounded-xl border bg-[#071018]" [class.border-success]="participant().isSpeaking" [class.shadow-[0_0_18px_rgba(34,197,94,.32)]]="participant().isSpeaking" [class.border-[#1b2a3e]]="!participant().isSpeaking">
      <video #video autoplay playsinline class="absolute inset-0 size-full object-cover" [class.object-contain]="screenSharing"></video><audio #audio autoplay></audio>
      @if (!hasVideo) { <div class="absolute inset-0 grid place-items-center bg-gradient-to-br" [class.from-[#0c274b]]="isLocal()" [class.from-[#0c2b23]]="!isLocal()" [class.to-[#05080d]]="true"><span class="grid size-14 place-items-center rounded-full border text-2xl font-semibold" [class.border-brand]="isLocal()" [class.text-[#8ab8ff]]="isLocal()" [class.border-success]="!isLocal()" [class.text-[#82e9ae]]="!isLocal()">{{ initials }}</span></div> }
      <div class="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/80 px-3 pb-3 pt-8 text-xs text-white">
        <span class="truncate font-semibold">{{ isLocal() ? 'You' : participant().name || participant().identity }} @if (isHost) { <small class="ml-1 text-amber">HOST</small> }</span>
        <span class="flex items-center gap-2">@if (screenSharing) { <lucide-icon [img]="Monitor" class="size-4 text-brand" /> } @if (muted) { <lucide-icon [img]="MicOff" class="size-4 text-danger" /> }</span>
      </div>
    </article>
  `
})
export class ParticipantTileComponent implements AfterViewChecked, OnDestroy {
  readonly participant = input.required<LocalParticipant | RemoteParticipant>()
  readonly isLocal = input(false)
  @ViewChild('video') private video?: ElementRef<HTMLVideoElement>
  @ViewChild('audio') private audio?: ElementRef<HTMLAudioElement>
  protected readonly MicOff = MicOff
  protected readonly Monitor = Monitor
  hasVideo = false
  screenSharing = false
  muted = true
  isHost = false
  initials = ''
  private attached: HTMLMediaElement | null = null
  private attachedTrack: Track | null = null
  private attachedAudio: HTMLMediaElement | null = null
  private attachedAudioTrack: Track | null = null

  ngAfterViewChecked(): void {
    const participant = this.participant()
    const camera = participant.getTrackPublication(Track.Source.Camera)
    const screen = participant.getTrackPublication(Track.Source.ScreenShare)
    const selected = screen?.track && !screen.isMuted ? screen.track : camera?.track && !camera.isMuted ? camera.track : undefined
    this.screenSharing = Boolean(screen?.track && !screen.isMuted)
    this.hasVideo = Boolean(selected)
    this.muted = !participant.getTrackPublication(Track.Source.Microphone)?.isSubscribed || Boolean(participant.getTrackPublication(Track.Source.Microphone)?.isMuted)
    this.isHost = participant.metadata === 'host'
    this.initials = (participant.name || participant.identity).split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase()
    const video = this.video?.nativeElement
    if (video && selected !== this.attachedTrack) {
      if (this.attachedTrack) this.attachedTrack.detach(video)
      if (selected) selected.attach(video)
      this.attached = selected ? video : null
      this.attachedTrack = selected ?? null
    }
    const audio = this.audio?.nativeElement
    const microphone = participant.getTrackPublication(Track.Source.Microphone)?.track
    if (!this.isLocal() && audio && microphone !== this.attachedAudioTrack) {
      if (this.attachedAudioTrack) this.attachedAudioTrack.detach(audio)
      if (microphone) microphone.attach(audio)
      this.attachedAudio = microphone ? audio : null
      this.attachedAudioTrack = microphone ?? null
    }
  }
  ngOnDestroy(): void { this.attached && this.attached.replaceChildren(); this.attachedAudio && this.attachedAudio.replaceChildren() }
}
