import { useEffect, useRef, useState } from 'react';
import { HandLandmarker } from '@mediapipe/tasks-vision';
import { HandLandmark } from '@/types';
import { getIndexFingerTip, findClosestNode } from '@/utils/geometry';
import { useAppStore } from '@/store/useAppStore';
import { UCI_KEYS, HOVER_THRESHOLD, SELECTION_DURATION } from '@/utils/constants';

export function useHandTracking(
  landmarker: HandLandmarker | null,
  videoElement: HTMLVideoElement | null,
  canvasSize: { width: number; height: number }
) {
  const updateHandLandmarks = useAppStore(state => state.updateHandLandmarks);
  const setHover = useAppStore(state => state.setHover);
  const hoveredKey = useAppStore(state => state.hoveredKey);
  const hoverStartTime = useAppStore(state => state.hoverStartTime);
  const updateHoverProgress = useAppStore(state => state.updateHoverProgress);
  const addSelection = useAppStore(state => state.addSelection);
  const systemState = useAppStore(state => state.systemState);

  const animationFrameRef = useRef<number>();
  const lastVideoTimeRef = useRef(-1);
  const [fingerPosition, setFingerPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!landmarker || !videoElement) return;

    let running = true;

    async function detectHands() {
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
            // Tomar la primera mano detectada
            const handLandmarks = results.landmarks[0] as unknown as HandLandmark[];
            const handedness = results.handednesses[0][0].categoryName; // 'Left' or 'Right'

            // Actualizar landmarks en el store
            if (handedness === 'Right') {
              updateHandLandmarks(null, handLandmarks);
            } else {
              updateHandLandmarks(handLandmarks, null);
            }

            // Obtener posición de punta del índice
            const fingerTip = getIndexFingerTip(handLandmarks);

            if (fingerTip && systemState === 'RECORDING') {
              // Convertir a píxeles (invertir X porque el video está espejado)
              const fingerPixels = {
                x: (1 - fingerTip.x) * canvasSize.width,
                y: fingerTip.y * canvasSize.height
              };

              setFingerPosition(fingerPixels);

              // Buscar tecla más cercana
              const closestKey = findClosestNode(
                fingerPixels,
                UCI_KEYS,
                canvasSize,
                HOVER_THRESHOLD
              );

              setHover(closestKey);
            } else {
              setFingerPosition(null);
              setHover(null);
            }
          } else {
            updateHandLandmarks(null, null);
            setFingerPosition(null);
            setHover(null);
          }
        } catch (error) {
          console.error('Hand detection error:', error);
        }
      }

      // Continuar loop
      if (running) {
        animationFrameRef.current = requestAnimationFrame(detectHands);
      }
    }

    // Iniciar detección
    animationFrameRef.current = requestAnimationFrame(detectHands);

    return () => {
      running = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [landmarker, videoElement, canvasSize, systemState, updateHandLandmarks, setHover]);

  // Progreso de hover
  useEffect(() => {
    if (!hoveredKey || !hoverStartTime || systemState !== 'RECORDING') {
      updateHoverProgress(0);
      return;
    }

    let animationFrame: number;

    function updateProgress() {
      const elapsed = Date.now() - hoverStartTime!;
      const progress = Math.min((elapsed / SELECTION_DURATION) * 100, 100);

      updateHoverProgress(progress);

      if (progress >= 100) {
        // Selección completada
        addSelection(hoveredKey!);
      } else {
        animationFrame = requestAnimationFrame(updateProgress);
      }
    }

    animationFrame = requestAnimationFrame(updateProgress);

    return () => cancelAnimationFrame(animationFrame);
  }, [hoveredKey, hoverStartTime, systemState, updateHoverProgress, addSelection]);

  return { fingerPosition };
}
