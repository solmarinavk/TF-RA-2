import { useEffect, useRef } from 'react';
import { PoseLandmarker, HandLandmarker } from '@mediapipe/tasks-vision';
import { PoseLandmark, HandLandmark } from '@/types';
import { detectLPose, isHandOpen, isHandClosed } from '@/utils/geometry';
import { useAppStore } from '@/store/useAppStore';

/**
 * Hook que detecta gestos combinados: brazo en L + estado de mano
 * - Brazo en L + palma abierta → Iniciar grabación
 * - Brazo en L + puño cerrado → Finalizar grabación
 */
export function useGestureDetection(
  poseLandmarker: PoseLandmarker | null,
  handLandmarker: HandLandmarker | null,
  videoElement: HTMLVideoElement | null
) {
  const updatePoseLandmarks = useAppStore(state => state.updatePoseLandmarks);
  const updateHandLandmarks = useAppStore(state => state.updateHandLandmarks);
  const updateGestureState = useAppStore(state => state.updateGestureState);

  const animationFrameRef = useRef<number>();
  const lastVideoTimeRef = useRef(-1);
  const lastLogTimeRef = useRef(0);

  useEffect(() => {
    if (!poseLandmarker || !handLandmarker || !videoElement) return;

    let running = true;

    async function detectGestures() {
      if (!running || !poseLandmarker || !handLandmarker || !videoElement) return;

      const currentTime = videoElement.currentTime;

      // Solo detectar si hay un nuevo frame
      if (currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = currentTime;

        try {
          // Detectar pose
          const poseResults = poseLandmarker.detectForVideo(
            videoElement,
            performance.now()
          );

          let poseLandmarks: PoseLandmark[] | null = null;
          if (poseResults.landmarks && poseResults.landmarks.length > 0) {
            poseLandmarks = poseResults.landmarks[0] as unknown as PoseLandmark[];
            updatePoseLandmarks(poseLandmarks);
          } else {
            updatePoseLandmarks(null);
          }

          // Detectar manos
          const handResults = handLandmarker.detectForVideo(
            videoElement,
            performance.now()
          );

          let leftHand: HandLandmark[] | null = null;
          let rightHand: HandLandmark[] | null = null;

          if (handResults.landmarks && handResults.landmarks.length > 0) {
            for (let i = 0; i < handResults.landmarks.length; i++) {
              const handLandmarks = handResults.landmarks[i] as unknown as HandLandmark[];
              const handedness = handResults.handednesses[i][0].categoryName;

              if (handedness === 'Right') {
                rightHand = handLandmarks;
              } else {
                leftHand = handLandmarks;
              }
            }
          }

          updateHandLandmarks(leftHand, rightHand);

          // Analizar gestos combinados
          if (poseLandmarks) {
            const lPoseStatus = detectLPose(poseLandmarks);
            const anyArmInL = lPoseStatus.left || lPoseStatus.right;

            // Detectar estado de la mano correspondiente al brazo en L
          const leftHandStatus = leftHand
            ? { open: isHandOpen(leftHand), closed: isHandClosed(leftHand) }
            : null;
          const rightHandStatus = rightHand
            ? { open: isHandOpen(rightHand), closed: isHandClosed(rightHand) }
            : null;

          let handOpen = false;
          let handClosed = false;
          let handSide = '';
          let hasHand = false;

          if (lPoseStatus.left) {
            if (leftHandStatus) {
              handOpen = leftHandStatus.open;
              handClosed = leftHandStatus.closed;
              handSide = 'izquierda';
              hasHand = true;
            } else if (rightHandStatus) {
              // Fallback: si la mano izquierda no se ve, usa la derecha para no perder la activación
              handOpen = rightHandStatus.open;
              handClosed = rightHandStatus.closed;
              handSide = 'derecha (fallback)';
              hasHand = true;
            }
          } else if (lPoseStatus.right) {
            if (rightHandStatus) {
              handOpen = rightHandStatus.open;
              handClosed = rightHandStatus.closed;
              handSide = 'derecha';
              hasHand = true;
            } else if (leftHandStatus) {
              // Fallback para brazo derecho usando mano izquierda si es lo único detectado
              handOpen = leftHandStatus.open;
              handClosed = leftHandStatus.closed;
              handSide = 'izquierda (fallback)';
              hasHand = true;
            }
          }

          // Si no detectamos ninguna mano pero el brazo está en L, asumimos palma abierta para simplificar el inicio
          if (anyArmInL && !hasHand) {
            handOpen = true;
            handClosed = false;
            handSide = 'no detectada (fallback)';
          }

            // Debug mejorado con throttle
            const now = Date.now();
            if (now - lastLogTimeRef.current > 1000) {
              lastLogTimeRef.current = now;

              if (anyArmInL) {
                console.log('🔍 DETECCIÓN ACTIVA:', {
                  brazoEnL: anyArmInL ? (lPoseStatus.left ? 'izquierdo' : 'derecho') : 'ninguno',
                  ángulo: lPoseStatus.left ? lPoseStatus.leftAngle?.toFixed(1) : lPoseStatus.rightAngle?.toFixed(1),
                  manoDetectada: hasHand,
                  manoLado: hasHand ? handSide : 'ninguna',
                  estadoMano: hasHand ? (handClosed ? 'CERRADA' : 'ABIERTA') : 'N/A'
                });
              }
            }

            // Actualizar estado del gesto
            updateGestureState(anyArmInL, handOpen, handClosed);
          }

        } catch (error) {
          console.error('Gesture detection error:', error);
        }
      }

      // Continuar loop
      if (running) {
        animationFrameRef.current = requestAnimationFrame(detectGestures);
      }
    }

    // Iniciar detección
    animationFrameRef.current = requestAnimationFrame(detectGestures);

    return () => {
      running = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [poseLandmarker, handLandmarker, videoElement, updatePoseLandmarks, updateHandLandmarks, updateGestureState]);
}
