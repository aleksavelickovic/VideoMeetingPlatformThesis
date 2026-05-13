import { useEffect, useState } from 'react'
import {UseDevicesResult} from "../types/hooks.ts";
import {DeviceInfo} from "../types/hooks.ts";

export function useDevices(): UseDevicesResult {
  const [cameras, setCameras] = useState<DeviceInfo[]>([])
  const [microphones, setMicrophones] = useState<DeviceInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState('')
  const [selectedMicrophone, setSelectedMicrophone] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function enumerateDevices() {
      try {
        await navigator.mediaDevices.getUserMedia({video: true, audio: true})

        const devices = await navigator.mediaDevices.enumerateDevices()

        const cams = devices
            .filter(d => d.kind === 'videoinput')
            .map(d => ({deviceId: d.deviceId, label: d.label}))

        const mics = devices
            .filter(d => d.kind === 'audioinput')
            .map(d => ({deviceId: d.deviceId, label: d.label}))

        setCameras(cams)
        setMicrophones(mics)

        if (cams.length) setSelectedCamera(cams[0].deviceId)
        if (mics.length) setSelectedMicrophone(mics[0].deviceId)
      } catch (e) {
        setError(e as Error)
      } finally {
        setIsLoading(false)
      }
    }

    enumerateDevices()

    navigator.mediaDevices.addEventListener('devicechange', enumerateDevices)

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', enumerateDevices)
    }
  }, [])

  return {
    cameras,
    microphones,
    selectedCamera,
    selectedMicrophone,
    setSelectedCamera,
    setSelectedMicrophone,
    isLoading,
    error,
  }
}