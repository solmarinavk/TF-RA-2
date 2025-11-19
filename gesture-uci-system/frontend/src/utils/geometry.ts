import { PoseLandmark, HandLandmark, PoseLandmarkIndex } from '@/types';
import { L_POSE_ANGLE_TOLERANCE } from './constants';

/**
 * Calcula el ángulo entre tres puntos usando producto punto
 * @param p1 - Primer punto (ej: hombro)
 * @param p2 - Punto medio (ej: codo) - vértice del ángulo
 * @param p3 - Tercer punto (ej: muñeca)
 * @returns Ángulo en grados (0-180)
 */
export function calculateAngle(
  p1: { x: number; y: number; z: number },
  p2: { x: number; y: number; z: number },
  p3: { x: number; y: number; z: number }
): number {
  // Vectores desde p2 hacia p1 y p3
  const v1 = {
    x: p1.x - p2.x,
    y: p1.y - p2.y,
    z: p1.z - p2.z
  };

  const v2 = {
    x: p3.x - p2.x,
    y: p3.y - p2.y,
    z: p3.z - p2.z
  };

  // Producto punto
  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;

  // Magnitudes
  const mag1 = Math.sqrt(v1.x ** 2 + v1.y ** 2 + v1.z ** 2);
  const mag2 = Math.sqrt(v2.x ** 2 + v2.y ** 2 + v2.z ** 2);

  // Evitar división por cero
  if (mag1 === 0 || mag2 === 0) return 0;

  // Ángulo en radianes
  const cosAngle = dot / (mag1 * mag2);

  // Clamp para evitar errores de precisión
  const clampedCos = Math.max(-1, Math.min(1, cosAngle));

  // Convertir a grados
  return Math.acos(clampedCos) * (180 / Math.PI);
}

/**
 * Calcula distancia euclidiana 2D entre dos puntos
 * @param p1 - Primer punto
 * @param p2 - Segundo punto
 * @returns Distancia en píxeles o unidades normalizadas
 */
export function calculateDistance(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Convierte coordenadas normalizadas (0-1) a píxeles
 * @param normalized - Coordenadas normalizadas
 * @param dimensions - Dimensiones del canvas
 * @returns Coordenadas en píxeles
 */
export function normalizeToPixels(
  normalized: { x: number; y: number },
  dimensions: { width: number; height: number }
): { x: number; y: number } {
  return {
    x: normalized.x * dimensions.width,
    y: normalized.y * dimensions.height
  };
}

/**
 * Detecta si el brazo izquierdo está en postura L
 * @param landmarks - Array de pose landmarks
 * @returns true si el brazo está en L (90° ± tolerancia)
 */
export function detectLeftLPose(landmarks: PoseLandmark[]): boolean {
  if (!landmarks || landmarks.length < 33) return false;

  const shoulder = landmarks[PoseLandmarkIndex.LEFT_SHOULDER];
  const elbow = landmarks[PoseLandmarkIndex.LEFT_ELBOW];
  const wrist = landmarks[PoseLandmarkIndex.LEFT_WRIST];

  // Verificar visibilidad
  if (
    !shoulder?.visibility || shoulder.visibility < 0.5 ||
    !elbow?.visibility || elbow.visibility < 0.5 ||
    !wrist?.visibility || wrist.visibility < 0.5
  ) {
    return false;
  }

  const angle = calculateAngle(shoulder, elbow, wrist);

  // Verificar si está cerca de 90 grados
  return Math.abs(angle - 90) < L_POSE_ANGLE_TOLERANCE;
}

/**
 * Detecta si el brazo derecho está en postura L
 * @param landmarks - Array de pose landmarks
 * @returns true si el brazo está en L (90° ± tolerancia)
 */
export function detectRightLPose(landmarks: PoseLandmark[]): boolean {
  if (!landmarks || landmarks.length < 33) return false;

  const shoulder = landmarks[PoseLandmarkIndex.RIGHT_SHOULDER];
  const elbow = landmarks[PoseLandmarkIndex.RIGHT_ELBOW];
  const wrist = landmarks[PoseLandmarkIndex.RIGHT_WRIST];

  // Verificar visibilidad
  if (
    !shoulder?.visibility || shoulder.visibility < 0.5 ||
    !elbow?.visibility || elbow.visibility < 0.5 ||
    !wrist?.visibility || wrist.visibility < 0.5
  ) {
    return false;
  }

  const angle = calculateAngle(shoulder, elbow, wrist);

  // Verificar si está cerca de 90 grados
  return Math.abs(angle - 90) < L_POSE_ANGLE_TOLERANCE;
}

/**
 * Detecta ambos brazos en postura L
 * @param landmarks - Array de pose landmarks
 * @returns Objeto con estado de cada brazo
 */
export function detectLPose(landmarks: PoseLandmark[]): {
  left: boolean;
  right: boolean;
  leftAngle: number | null;
  rightAngle: number | null;
} {
  if (!landmarks || landmarks.length < 33) {
    return { left: false, right: false, leftAngle: null, rightAngle: null };
  }

  const leftShoulder = landmarks[PoseLandmarkIndex.LEFT_SHOULDER];
  const leftElbow = landmarks[PoseLandmarkIndex.LEFT_ELBOW];
  const leftWrist = landmarks[PoseLandmarkIndex.LEFT_WRIST];

  const rightShoulder = landmarks[PoseLandmarkIndex.RIGHT_SHOULDER];
  const rightElbow = landmarks[PoseLandmarkIndex.RIGHT_ELBOW];
  const rightWrist = landmarks[PoseLandmarkIndex.RIGHT_WRIST];

  let leftAngle: number | null = null;
  let rightAngle: number | null = null;

  // Calcular ángulo izquierdo
  if (
    leftShoulder?.visibility && leftShoulder.visibility >= 0.5 &&
    leftElbow?.visibility && leftElbow.visibility >= 0.5 &&
    leftWrist?.visibility && leftWrist.visibility >= 0.5
  ) {
    leftAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
  }

  // Calcular ángulo derecho
  if (
    rightShoulder?.visibility && rightShoulder.visibility >= 0.5 &&
    rightElbow?.visibility && rightElbow.visibility >= 0.5 &&
    rightWrist?.visibility && rightWrist.visibility >= 0.5
  ) {
    rightAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
  }

  return {
    left: leftAngle !== null && Math.abs(leftAngle - 90) < L_POSE_ANGLE_TOLERANCE,
    right: rightAngle !== null && Math.abs(rightAngle - 90) < L_POSE_ANGLE_TOLERANCE,
    leftAngle,
    rightAngle
  };
}

/**
 * Extrae la posición de la punta del dedo índice de hand landmarks
 * @param handLandmarks - Array de hand landmarks
 * @returns Posición normalizada de la punta del índice o null
 */
export function getIndexFingerTip(handLandmarks: HandLandmark[] | null): { x: number; y: number } | null {
  if (!handLandmarks || handLandmarks.length < 21) return null;

  // INDEX_FINGER_TIP es el landmark 8
  const tip = handLandmarks[8];

  if (!tip) return null;

  return { x: tip.x, y: tip.y };
}

/**
 * Calcula la distancia de un punto a todos los nodos y retorna el más cercano
 * @param point - Punto en píxeles
 * @param nodes - Array de nodos con posiciones normalizadas
 * @param dimensions - Dimensiones del canvas
 * @param threshold - Distancia máxima para considerar hover
 * @returns ID del nodo más cercano o null
 */
export function findClosestNode(
  point: { x: number; y: number },
  nodes: Array<{ id: string; position: { x: number; y: number }; radius: number }>,
  dimensions: { width: number; height: number },
  threshold: number
): string | null {
  let closestId: string | null = null;
  let minDistance = Infinity;

  for (const node of nodes) {
    const nodePixels = normalizeToPixels(node.position, dimensions);
    const distance = calculateDistance(point, nodePixels);

    if (distance < threshold && distance < minDistance) {
      minDistance = distance;
      closestId = node.id;
    }
  }

  return closestId;
}

/**
 * Interpola entre dos valores con easing
 * @param start - Valor inicial
 * @param end - Valor final
 * @param t - Factor de interpolación (0-1)
 * @returns Valor interpolado
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Easing cubic out para animaciones suaves
 * @param t - Factor de tiempo (0-1)
 * @returns Valor con easing aplicado
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Calcula distancia 3D entre dos landmarks
 * @param p1 - Primer landmark
 * @param p2 - Segundo landmark
 * @returns Distancia euclidiana 3D
 */
function distance3D(
  p1: { x: number; y: number; z: number },
  p2: { x: number; y: number; z: number }
): number {
  return Math.sqrt(
    Math.pow(p2.x - p1.x, 2) +
    Math.pow(p2.y - p1.y, 2) +
    Math.pow(p2.z - p1.z, 2)
  );
}

/**
 * Detecta si la mano está abierta (palma extendida)
 * @param handLandmarks - Array de hand landmarks (21 puntos)
 * @returns true si la palma está abierta
 */
export function isHandOpen(handLandmarks: HandLandmark[] | null): boolean {
  if (!handLandmarks || handLandmarks.length < 21) return false;

  const wrist = handLandmarks[0]; // Muñeca

  // Puntas de los dedos (índice, medio, anular, meñique)
  const fingerTips = [8, 12, 16, 20];

  // Bases de los dedos (MCPs)
  const fingerBases = [5, 9, 13, 17];

  // Verificar que todos los dedos estén extendidos
  let extendedFingers = 0;

  for (let i = 0; i < fingerTips.length; i++) {
    const tip = handLandmarks[fingerTips[i]];
    const base = handLandmarks[fingerBases[i]];

    // Distancia de punta a muñeca vs base a muñeca
    const tipToWrist = distance3D(tip, wrist);
    const baseToWrist = distance3D(base, wrist);

    // Si la punta está más lejos de la muñeca que la base, el dedo está extendido
    if (tipToWrist > baseToWrist * 1.05) {
      extendedFingers++;
    }
  }

  // Verificar pulgar por separado (diferente geometría)
  const thumbTip = handLandmarks[4];
  const thumbBase = handLandmarks[2];
  const thumbToWrist = distance3D(thumbTip, wrist);
  const thumbBaseToWrist = distance3D(thumbBase, wrist);

  if (thumbToWrist > thumbBaseToWrist * 1.05) {
    extendedFingers++;
  }

  // La mano está abierta si al menos 3 dedos están extendidos (más permisivo)
  return extendedFingers >= 3;
}

/**
 * Detecta si la mano está cerrada (puño)
 * @param handLandmarks - Array de hand landmarks (21 puntos)
 * @returns true si la mano está cerrada
 */
export function isHandClosed(handLandmarks: HandLandmark[] | null): boolean {
  if (!handLandmarks || handLandmarks.length < 21) return false;

  const wrist = handLandmarks[0]; // Muñeca

  // Puntas de los dedos
  const fingerTips = [8, 12, 16, 20];

  // Bases de los dedos (MCPs)
  const fingerBases = [5, 9, 13, 17];

  // Verificar que todos los dedos estén doblados
  let closedFingers = 0;

  for (let i = 0; i < fingerTips.length; i++) {
    const tip = handLandmarks[fingerTips[i]];
    const base = handLandmarks[fingerBases[i]];

    // Distancia de punta a muñeca vs base a muñeca
    const tipToWrist = distance3D(tip, wrist);
    const baseToWrist = distance3D(base, wrist);

    // Si la punta está más cerca de la muñeca que la base, el dedo está doblado
    if (tipToWrist < baseToWrist * 1.2) {
      closedFingers++;
    }
  }

  // La mano está cerrada si al menos 3 dedos están doblados
  return closedFingers >= 3;
}
