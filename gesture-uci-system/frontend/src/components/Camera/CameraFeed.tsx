import React, { useEffect, useRef, useState } from 'react';
import { getCameraStream, stopCameraStream } from '@/utils/mediapipe';

interface CameraFeedProps {
  onVideoReady?: (video: HTMLVideoElement) => void;
  className?: string;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({ onVideoReady, className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function setupCamera() {
      try {
        const mediaStream = await getCameraStream('user');

        if (!mounted || !mediaStream) {
          setError('No se pudo acceder a la cámara');
          return;
        }

        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;

          // Esperar a que el video esté listo
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current && onVideoReady) {
              videoRef.current.play();
              onVideoReady(videoRef.current);
            }
          };
        }
      } catch (err) {
        console.error('Camera setup error:', err);
        if (mounted) {
          setError('Error al configurar la cámara');
        }
      }
    }

    setupCamera();

    return () => {
      mounted = false;
      if (stream) {
        stopCameraStream(stream);
      }
    };
  }, [onVideoReady]);

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">📹</div>
          <div className="text-xl font-bold mb-2">Error de Cámara</div>
          <div className="text-gray-400">{error}</div>
          <div className="text-sm text-gray-500 mt-4">
            Asegúrate de permitir el acceso a la cámara
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <video
        ref={videoRef}
        className={className || "absolute inset-0 w-full h-full object-cover scale-x-[-1]"}
        autoPlay
        playsInline
        muted
      />
    </>
  );
};
