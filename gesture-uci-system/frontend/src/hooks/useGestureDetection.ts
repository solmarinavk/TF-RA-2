import { useEffect, useRef } from 'react';
import { PoseLandmarker, HandLandmarker } from '@mediapipe/tasks-vision';
import { PoseLandmark, HandLandmark } from '@/types';
import { detectLPose, isThumbsUp } from '@/utils/geometry';
import { useAppStore } from '@/store/useAppStore';

/**
 * Hook que detecta gestos de brazo en L para control del sistema
 * - Brazo IZQUIERDO en L (completamente visible) → Iniciar grabación
 * - Brazo DERECHO en L + pulgar arriba (👍) → Finalizar grabación
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

          // Detectar manos (para tracking del índice, no para gestos FSM)
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

          // Analizar gestos de brazos en L
          if (poseLandmarks) {
            const lPoseStatus = detectLPose(poseLandmarks);

            // Detectar si la mano derecha está haciendo pulgar arriba (👍) - necesario para terminar grabación
            const rightHandThumbsUp = isThumbsUp(rightHand);

            // Debug mejorado con throttle - mostrar SIEMPRE los ángulos
            const now = Date.now();
            if (now - lastLogTimeRef.current > 500) {
              lastLogTimeRef.current = now;

              console.log('🔍 ÁNGULOS DETECTADOS:', {
                brazoIzq: lPoseStatus.leftAngle ? `${lPoseStatus.leftAngle.toFixed(1)}° ${lPoseStatus.left ? '✅ EN L' : ''}` : 'no visible',
                brazoIzqVisible: lPoseStatus.leftVisibleInFrame ? '✅ visible en pantalla' : '❌ fuera de pantalla',
                brazoDer: lPoseStatus.rightAngle ? `${lPoseStatus.rightAngle.toFixed(1)}° ${lPoseStatus.right ? '✅ EN L' : ''}` : 'no visible',
                manoDer: rightHandThumbsUp ? '👍 PULGAR ARRIBA' : '✋ otra posición/no detectada',
                tolerancia: '45-135°'
              });
            }

            // Actualizar estado del gesto
            // Para iniciar: solo brazo izquierdo en L (completamente visible en pantalla)
            // Para terminar: brazo derecho en L + pulgar arriba (👍)
            updateGestureState(lPoseStatus.left, lPoseStatus.right, rightHandThumbsUp);
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
