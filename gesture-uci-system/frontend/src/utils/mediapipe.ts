/**
 * MediaPipe Vision Tasks configuration and initialization
 *
 * Este módulo proporciona helpers para inicializar y configurar
 * PoseLandmarker y HandLandmarker de MediaPipe.
 */

// Nota: En producción, estos imports vendrían de @mediapipe/tasks-vision
// Para esta implementación, proveeremos tipos mock que serán compatibles

// Detectar si es móvil para ajustar umbrales de confianza
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
};

export interface MediaPipeConfig {
  modelAssetPath: string;
  delegate?: 'GPU' | 'CPU';
  runningMode?: 'IMAGE' | 'VIDEO';
}

export const POSE_LANDMARKER_CONFIG: MediaPipeConfig = {
  modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
  delegate: 'GPU',
  runningMode: 'VIDEO'
};

export const HAND_LANDMARKER_CONFIG: MediaPipeConfig = {
  modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
  delegate: 'GPU',
  runningMode: 'VIDEO'
};

/**
 * Configuración por defecto para PoseLandmarker
 * En móvil usamos umbrales más bajos (0.3) porque las cámaras tienen menor calidad
 */
export const getPoseLandmarkerOptions = () => {
  const confidence = isMobileDevice() ? 0.3 : 0.5;
  return {
    baseOptions: {
      modelAssetPath: POSE_LANDMARKER_CONFIG.modelAssetPath,
      delegate: POSE_LANDMARKER_CONFIG.delegate
    },
    runningMode: POSE_LANDMARKER_CONFIG.runningMode,
    numPoses: 1,
    minPoseDetectionConfidence: confidence,
    minPosePresenceConfidence: confidence,
    minTrackingConfidence: confidence
  };
};

/**
 * Configuración por defecto para HandLandmarker
 * En móvil usamos umbrales más bajos (0.3) porque las cámaras tienen menor calidad
 */
export const getHandLandmarkerOptions = () => {
  const confidence = isMobileDevice() ? 0.3 : 0.5;
  return {
    baseOptions: {
      modelAssetPath: HAND_LANDMARKER_CONFIG.modelAssetPath,
      delegate: HAND_LANDMARKER_CONFIG.delegate
    },
    runningMode: HAND_LANDMARKER_CONFIG.runningMode,
    numHands: 2,
    minHandDetectionConfidence: confidence,
    minHandPresenceConfidence: confidence,
    minTrackingConfidence: confidence
  };
};

/**
 * Inicializa MediaPipe FilesetResolver (necesario para cargar WASM)
 */
export async function initializeMediaPipe() {
  try {
    // En producción, esto vendría de:
    // const { FilesetResolver } = await import('@mediapipe/tasks-vision');
    // const vision = await FilesetResolver.forVisionTasks(...);

    console.log('📦 MediaPipe initialized (using demo mode)');
    return true;
  } catch (error) {
    console.error('Failed to initialize MediaPipe:', error);
    return false;
  }
}

/**
 * Verifica si el navegador soporta las APIs necesarias
 */
export function checkBrowserSupport(): { supported: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    missing.push('getUserMedia');
  }

  if (!window.requestAnimationFrame) {
    missing.push('requestAnimationFrame');
  }

  // WebGL para GPU acceleration
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  if (!gl) {
    missing.push('WebGL');
  }

  return {
    supported: missing.length === 0,
    missing
  };
}

/**
 * Obtiene stream de cámara con configuración óptima
 */
export async function getCameraStream(facingMode: 'user' | 'environment' = 'user'): Promise<MediaStream | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode,
        frameRate: { ideal: 30 }
      },
      audio: false
    });

    console.log('📹 Camera stream acquired');
    return stream;
  } catch (error) {
    console.error('Failed to get camera stream:', error);
    return null;
  }
}

/**
 * Detiene un stream de cámara y libera recursos
 */
export function stopCameraStream(stream: MediaStream | null): void {
  if (!stream) return;

  stream.getTracks().forEach(track => {
    track.stop();
  });

  console.log('📹 Camera stream stopped');
}

/**
 * Calcula FPS basado en timestamps
 */
export class FPSCalculator {
  private frameTimes: number[] = [];
  private maxSamples = 30;

  addFrame(timestamp: number): void {
    this.frameTimes.push(timestamp);
    if (this.frameTimes.length > this.maxSamples) {
      this.frameTimes.shift();
    }
  }

  getFPS(): number {
    if (this.frameTimes.length < 2) return 0;

    const deltas: number[] = [];
    for (let i = 1; i < this.frameTimes.length; i++) {
      deltas.push(this.frameTimes[i] - this.frameTimes[i - 1]);
    }

    const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    return avgDelta > 0 ? 1000 / avgDelta : 0;
  }

  reset(): void {
    this.frameTimes = [];
  }
}
