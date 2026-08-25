import {AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject} from '@angular/core'
import {ActivatedRoute} from '@angular/router'
import {RemoteAudioTrack, RemoteTrackPublication, RemoteVideoTrack, Room, RoomEvent, Track} from 'livekit-client'

@Component({
    selector: 'app-participant-egress-template',
    template: `
        <main class="egress-canvas">
            <video #video autoplay playsinline></video>
            <div #audioHost></div>
        </main>
    `,
    styles: [`
        :host { display: block; width: 100vw; height: 100vh; overflow: hidden; background: #000; }
        .egress-canvas { width: 100%; height: 100%; background: #000; }
        video { display: block; width: 100%; height: 100%; object-fit: contain; background: #000; }
    `]
})
export class ParticipantEgressTemplateComponent implements AfterViewInit, OnDestroy {
    @ViewChild('video', {static: true}) private readonly video!: ElementRef<HTMLVideoElement>
    @ViewChild('audioHost', {static: true}) private readonly audioHost!: ElementRef<HTMLDivElement>

    private readonly route = inject(ActivatedRoute)
    private room: Room | null = null
    private targetIdentity = ''
    private recordingStarted = false
    private selectedVideo: RemoteVideoTrack | null = null
    private readonly videoTracks = new Map<string, RemoteVideoTrack>()
    private readonly videoPublications = new Map<string, RemoteTrackPublication>()
    private readonly audioTracks = new Map<string, RemoteAudioTrack>()

    async ngAfterViewInit(): Promise<void> {
        const params = this.route.snapshot.queryParamMap
        const token = params.get('token')
        const livekitUrl = params.get('url') ?? params.get('livekitUrl')
        this.targetIdentity = params.get('identity') ?? ''
        if (!token || !livekitUrl || !this.targetIdentity) return

        const room = new Room()
        this.room = room
        room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
            if (participant.identity !== this.targetIdentity) return
            this.addTrack(track as RemoteAudioTrack | RemoteVideoTrack, publication)
        })
        room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
            if (participant.identity !== this.targetIdentity) return
            this.removeTrack(track as RemoteAudioTrack | RemoteVideoTrack, publication)
        })
        room.on(RoomEvent.TrackMuted, (publication, participant) => {
            if (participant.identity === this.targetIdentity) this.selectVideo()
        })
        room.on(RoomEvent.TrackUnmuted, (publication, participant) => {
            if (participant.identity === this.targetIdentity) this.selectVideo()
        })
        room.on(RoomEvent.ParticipantDisconnected, participant => {
            if (participant.identity === this.targetIdentity) this.clearTracks()
        })
        room.on(RoomEvent.Disconnected, () => console.log('END_RECORDING'))

        try {
            await room.connect(livekitUrl, token, {autoSubscribe: true})
        } catch (error) {
            console.error('Participant egress template failed to connect', error)
        }
    }

    private addTrack(track: RemoteAudioTrack | RemoteVideoTrack, publication: RemoteTrackPublication): void {
        if (track.kind === Track.Kind.Video) {
            const videoTrack = track as RemoteVideoTrack
            if (publication.source === Track.Source.Camera || publication.source === Track.Source.ScreenShare) {
                this.videoTracks.set(publication.source, videoTrack)
                this.videoPublications.set(publication.source, publication)
                this.selectVideo()
                this.startRecordingWhenReady()
            }
            return
        }

        if (track.kind === Track.Kind.Audio) {
            const audioTrack = track as RemoteAudioTrack
            this.audioTracks.set(publication.trackSid, audioTrack)
            this.audioHost.nativeElement.append(audioTrack.attach())
            this.startRecordingWhenReady()
        }
    }

    private startRecordingWhenReady(): void {
        if (this.recordingStarted) return
        if (this.videoTracks.size === 0 && this.audioTracks.size === 0) return
        this.recordingStarted = true
        console.log('START_RECORDING')
    }

    private removeTrack(track: RemoteAudioTrack | RemoteVideoTrack, publication: RemoteTrackPublication): void {
        if (track.kind === Track.Kind.Video) {
            if (this.videoTracks.get(publication.source) === track) {
                this.videoTracks.delete(publication.source)
                this.videoPublications.delete(publication.source)
                this.selectVideo()
            }
            return
        }

        const audioTrack = this.audioTracks.get(publication.trackSid)
        if (audioTrack) {
            audioTrack.detach().forEach(element => element.remove())
            this.audioTracks.delete(publication.trackSid)
        }
    }

    private selectVideo(): void {
        const screenShare = this.videoTracks.get(Track.Source.ScreenShare)
        const screenSharePublication = this.videoPublications.get(Track.Source.ScreenShare)
        const camera = this.videoTracks.get(Track.Source.Camera)
        const cameraPublication = this.videoPublications.get(Track.Source.Camera)
        const next = screenShare && !screenSharePublication?.isMuted
            ? screenShare
            : camera && !cameraPublication?.isMuted
                ? camera
                : null

        if (next === this.selectedVideo) return
        this.selectedVideo?.detach(this.video.nativeElement)
        this.selectedVideo = next
        this.selectedVideo?.attach(this.video.nativeElement)
    }

    private clearTracks(): void {
        this.selectedVideo?.detach(this.video.nativeElement)
        this.selectedVideo = null
        this.videoTracks.clear()
        this.videoPublications.clear()
        this.audioTracks.forEach(track => track.detach().forEach(element => element.remove()))
        this.audioTracks.clear()
    }

    ngOnDestroy(): void {
        this.clearTracks()
        this.room?.disconnect()
        this.room = null
    }
}
