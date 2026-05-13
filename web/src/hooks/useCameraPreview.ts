import {useState, useEffect, useRef} from "react";
import {UseCameraPreviewResult} from "../types/hooks.ts";

export function useCameraPreview(selectedCamera: string): UseCameraPreviewResult {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    useEffect(() => {
        if (!selectedCamera) return;

        let active = true;

        async function startPreview() {
            if (stream) {
                stream.getTracks().forEach(t => t.stop());
            }

            try {
                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: {deviceId: {exact: selectedCamera}},
                    audio: false,
                });

                if (!active) {
                    newStream.getTracks().forEach(t => t.stop());
                    return;
                }

                setStream(newStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = newStream;
                }
            } catch {
                setStream(null);
            }
        }

        startPreview();

        return () => {
            active = false;
        };
    }, [selectedCamera]);

    useEffect(() => {
        return () => {
            stream?.getTracks().forEach(t => t.stop());
        };
    }, [stream]);

    return {videoRef, stream};
}