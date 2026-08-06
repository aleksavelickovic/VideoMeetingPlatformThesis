import { Injectable, signal } from '@angular/core'

export interface MediaDeviceOption { deviceId: string; label: string }

@Injectable({ providedIn: 'root' })
export class MediaDevicesService {
  readonly cameras = signal<MediaDeviceOption[]>([])
  readonly microphones = signal<MediaDeviceOption[]>([])
  readonly loading = signal(false)
  readonly error = signal<string | null>(null)

  async enumerate(): Promise<void> {
    this.loading.set(true)
    this.error.set(null)
    try {
      const permission = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      permission.getTracks().forEach(track => track.stop())
      const devices = await navigator.mediaDevices.enumerateDevices()
      this.cameras.set(devices.filter(item => item.kind === 'videoinput').map(item => ({ deviceId: item.deviceId, label: item.label || 'Camera' })))
      this.microphones.set(devices.filter(item => item.kind === 'audioinput').map(item => ({ deviceId: item.deviceId, label: item.label || 'Microphone' })))
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Device access was denied.')
    } finally { this.loading.set(false) }
  }
}
