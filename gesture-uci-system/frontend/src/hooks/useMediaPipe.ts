import { useState, useEffect } from 'react';
import {
  PoseLandmarker,
  HandLandmarker,
  FilesetResolver
} from '@mediapipe/tasks-vision';

export function useMediaPipe() {
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(null);
  const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initializeMediaPipe() {
      try {
        console.log('📦 Initializing MediaPipe...');

        // Cargar FilesetResolver
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        if (!mounted) return;

        // Inicializar PoseLandmarker
        const pose = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        if (!mounted) return;

        // Inicializar HandLandmarker
        const hand = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        if (!mounted) return;

        setPoseLandmarker(pose);
        setHandLandmarker(hand);
        setIsReady(true);
        setIsLoading(false);
        console.log('✅ MediaPipe initialized successfully');
      } catch (err) {
        console.error('❌ MediaPipe initialization failed:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize MediaPipe');
          setIsLoading(false);
        }
      }
    }

    initializeMediaPipe();

    return () => {
      mounted = false;
      // Cleanup
      if (poseLandmarker) {
        poseLandmarker.close();
      }
      if (handLandmarker) {
        handLandmarker.close();
      }
    };
  }, []);

  return {
    poseLandmarker,
    handLandmarker,
    isLoading,
    error,
    isReady
  };
}
