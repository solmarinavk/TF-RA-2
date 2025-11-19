import { useEffect, useRef } from 'react';
import { PoseLandmarker } from '@mediapipe/tasks-vision';
import { PoseLandmark } from '@/types';
import { detectLPose } from '@/utils/geometry';
import { useAppStore } from '@/store/useAppStore';

export function usePoseDetection(
  landmarker: PoseLandmarker | null,
  videoElement: HTMLVideoElement | null
) {
  const updatePoseLandmarks = useAppStore(state => state.updatePoseLandmarks);
  const updateLPoseState = useAppStore(state => state.updateLPoseState);
  const animationFrameRef = useRef<number>();
  const lastVideoTimeRef = useRef(-1);

  useEffect(() => {
    if (!landmarker || !videoElement) return;

    let running = true;

    async function detectPose() {
      if (!running || !landmarker || !videoElement) return;

      const currentTime = videoElement.currentTime;

      // Solo detectar si hay un nuevo frame
      if (currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = currentTime;

        try {
          const results = landmarker.detectForVideo(
            videoElement,
            performance.now()
          );

          if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0] as unknown as PoseLandmark[];

            // Actualizar landmarks en el store
            updatePoseLandmarks(landmarks);

            // Detectar postura L
            const lPoseStatus = detectLPose(landmarks);
            updateLPoseState(lPoseStatus.left, lPoseStatus.right);
          } else {
            updatePoseLandmarks(null);
            updateLPoseState(false, false);
          }
        } catch (error) {
          console.error('Pose detection error:', error);
        }
      }

      // Continuar loop
      if (running) {
        animationFrameRef.current = requestAnimationFrame(detectPose);
      }
    }

    // Iniciar detección
    animationFrameRef.current = requestAnimationFrame(detectPose);

    return () => {
      running = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [landmarker, videoElement, updatePoseLandmarks, updateLPoseState]);
}
