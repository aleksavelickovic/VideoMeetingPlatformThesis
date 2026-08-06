import { Injectable, signal, inject } from '@angular/core'
import { ConnectionState, LocalParticipant, RemoteParticipant, Room, RoomEvent } from 'livekit-client'
import { RuntimeConfigService } from './runtime-config.service'

@Injectable({ providedIn: 'root' })
export class LiveKitRoomService {
  private readonly config = inject(RuntimeConfigService)
  private activeRoom: Room | null = null
  readonly room = signal<Room | null>(null)
  readonly localParticipant = signal<LocalParticipant | null>(null)
  readonly remoteParticipants = signal<RemoteParticipant[]>([])
  readonly connected = signal(false)
  readonly reconnecting = signal(false)
  readonly recording = signal(false)
  readonly error = signal<string | null>(null)

  async connect(token: string, name: string, cameraId?: string, microphoneId?: string): Promise<void> {
    this.disconnect()
    const room = new Room({
      videoCaptureDefaults: cameraId ? { deviceId: cameraId } : undefined,
      audioCaptureDefaults: microphoneId ? { deviceId: microphoneId } : undefined
    })
    this.activeRoom = room
    this.room.set(room)
    const sync = () => {
      this.localParticipant.set(room.localParticipant)
      this.remoteParticipants.set([...room.remoteParticipants.values()])
    }
    room.on(RoomEvent.ParticipantConnected, sync)
    room.on(RoomEvent.ParticipantDisconnected, sync)
    room.on(RoomEvent.ParticipantNameChanged, sync)
    room.on(RoomEvent.TrackSubscribed, sync)
    room.on(RoomEvent.TrackUnsubscribed, sync)
    room.on(RoomEvent.TrackPublished, sync)
    room.on(RoomEvent.TrackUnpublished, sync)
    room.on(RoomEvent.LocalTrackPublished, sync)
    room.on(RoomEvent.LocalTrackUnpublished, sync)
    room.on(RoomEvent.ActiveSpeakersChanged, sync)
    room.on(RoomEvent.ConnectionQualityChanged, sync)
    room.on(RoomEvent.Reconnecting, () => this.reconnecting.set(true))
    room.on(RoomEvent.Reconnected, () => { this.reconnecting.set(false); sync() })
    room.on(RoomEvent.RecordingStatusChanged, value => this.recording.set(value))
    room.on(RoomEvent.Disconnected, () => {
      this.connected.set(false)
      this.reconnecting.set(false)
      this.remoteParticipants.set([])
      this.localParticipant.set(null)
    })
    try {
      await room.connect(this.config.liveKitUrl, token)
      if (this.activeRoom !== room) { room.disconnect(); return }
      if (name.trim() && name.trim() !== room.localParticipant.name) await room.localParticipant.setName(name.trim())
      await Promise.all([room.localParticipant.setCameraEnabled(true), room.localParticipant.setMicrophoneEnabled(true)])
      this.connected.set(room.state === ConnectionState.Connected)
      this.recording.set(room.isRecording)
      sync()
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to connect to LiveKit.')
      room.disconnect()
    }
  }

  disconnect(): void {
    this.activeRoom?.disconnect()
    this.activeRoom = null
    this.room.set(null)
  }
}
