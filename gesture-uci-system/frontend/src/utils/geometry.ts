import { PoseLandmark, HandLandmark, PoseLandmarkIndex } from '@/types';
import { L_POSE_ANGLE_TOLERANCE, MIN_LANDMARK_VISIBILITY } from './constants';

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
    !shoulder?.visibility || shoulder.visibility < MIN_LANDMARK_VISIBILITY ||
    !elbow?.visibility || elbow.visibility < MIN_LANDMARK_VISIBILITY ||
    !wrist?.visibility || wrist.visibility < MIN_LANDMARK_VISIBILITY
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
    !shoulder?.visibility || shoulder.visibility < MIN_LANDMARK_VISIBILITY ||
    !elbow?.visibility || elbow.visibility < MIN_LANDMARK_VISIBILITY ||
    !wrist?.visibility || wrist.visibility < MIN_LANDMARK_VISIBILITY
  ) {
    return false;
  }

  const angle = calculateAngle(shoulder, elbow, wrist);

  // Verificar si está cerca de 90 grados
  return Math.abs(angle - 90) < L_POSE_ANGLE_TOLERANCE;
}

/**
 * Verifica si un brazo está completamente visible en pantalla
 * @param shoulder - Landmark del hombro
 * @param elbow - Landmark del codo
 * @param wrist - Landmark de la muñeca
 * @returns true si los 3 puntos están dentro de los límites visibles
 */
function isArmVisibleInFrame(
  shoulder: PoseLandmark,
  elbow: PoseLandmark,
  wrist: PoseLandmark
): boolean {
  // Márgenes para considerar visible (5% del borde de la pantalla)
  const margin = 0.05;
  const minX = margin;
  const maxX = 1 - margin;
  const minY = margin;
  const maxY = 1 - margin;

  const points = [shoulder, elbow, wrist];

  for (const point of points) {
    if (point.x < minX || point.x > maxX || point.y < minY || point.y > maxY) {
      return false;
    }
  }

  return true;
}

/**
 * Detecta ambos brazos en postura L
 * @param landmarks - Array de pose landmarks
 * @returns Objeto con estado de cada brazo y si está visible en pantalla
 */
export function detectLPose(landmarks: PoseLandmark[]): {
  left: boolean;
  right: boolean;
  leftAngle: number | null;
  rightAngle: number | null;
  leftVisibleInFrame: boolean;
  rightVisibleInFrame: boolean;
} {
  if (!landmarks || landmarks.length < 33) {
    return {
      left: false,
      right: false,
      leftAngle: null,
      rightAngle: null,
      leftVisibleInFrame: false,
      rightVisibleInFrame: false
    };
  }

  const leftShoulder = landmarks[PoseLandmarkIndex.LEFT_SHOULDER];
  const leftElbow = landmarks[PoseLandmarkIndex.LEFT_ELBOW];
  const leftWrist = landmarks[PoseLandmarkIndex.LEFT_WRIST];

  const rightShoulder = landmarks[PoseLandmarkIndex.RIGHT_SHOULDER];
  const rightElbow = landmarks[PoseLandmarkIndex.RIGHT_ELBOW];
  const rightWrist = landmarks[PoseLandmarkIndex.RIGHT_WRIST];

  let leftAngle: number | null = null;
  let rightAngle: number | null = null;
  let leftVisibleInFrame = false;
  let rightVisibleInFrame = false;

  // Calcular ángulo izquierdo
  if (
    leftShoulder?.visibility && leftShoulder.visibility >= MIN_LANDMARK_VISIBILITY &&
    leftElbow?.visibility && leftElbow.visibility >= MIN_LANDMARK_VISIBILITY &&
    leftWrist?.visibility && leftWrist.visibility >= MIN_LANDMARK_VISIBILITY
  ) {
    leftAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    leftVisibleInFrame = isArmVisibleInFrame(leftShoulder, leftElbow, leftWrist);
  }

  // Calcular ángulo derecho
  if (
    rightShoulder?.visibility && rightShoulder.visibility >= MIN_LANDMARK_VISIBILITY &&
    rightElbow?.visibility && rightElbow.visibility >= MIN_LANDMARK_VISIBILITY &&
    rightWrist?.visibility && rightWrist.visibility >= MIN_LANDMARK_VISIBILITY
  ) {
    rightAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    rightVisibleInFrame = isArmVisibleInFrame(rightShoulder, rightElbow, rightWrist);
  }

  return {
    left: leftAngle !== null && Math.abs(leftAngle - 90) < L_POSE_ANGLE_TOLERANCE && leftVisibleInFrame,
    right: rightAngle !== null && Math.abs(rightAngle - 90) < L_POSE_ANGLE_TOLERANCE,
    leftAngle,
    rightAngle,
    leftVisibleInFrame,
    rightVisibleInFrame
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
 * @param threshold - Distancia máxima base (se usa el mayor entre threshold y radius del nodo)
 * @returns ID del nodo más cercano o null
 */
export function findClosestNode(
  point: { x: number; y: number },
  nodes: Array<{ id: string; position: { x: number; y: number }; radius: number }>,
  dimensions: { width: number; height: number },
  _threshold: number // No usado - ahora usamos node.radius directamente
): string | null {
  let closestId: string | null = null;
  let minDistance = Infinity;

  for (const node of nodes) {
    const nodePixels = normalizeToPixels(node.position, dimensions);
    const distance = calculateDistance(point, nodePixels);

    // Detectar si el dedo está DENTRO del círculo (distance < radius)
    // Usamos el radio del nodo como threshold para que funcione en cualquier parte del círculo
    const effectiveThreshold = node.radius;

    if (distance < effectiveThreshold && distance < minDistance) {
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
 * Estrategia simple: la mano está abierta si NO está cerrada
 * @param handLandmarks - Array de hand landmarks (21 puntos)
 * @returns true si la palma está abierta
 */
export function isHandOpen(handLandmarks: HandLandmark[] | null): boolean {
  if (!handLandmarks || handLandmarks.length < 21) return false;

  // Estrategia simplificada: si no está cerrada, está abierta
  // Esto hace que sea mucho más fácil activar el inicio de grabación
  return !isHandClosed(handLandmarks);
}

/**
 * Detecta si la mano está cerrada (puño)
 * MUY estricto para evitar cortes accidentales de grabación
 * @param handLandmarks - Array de hand landmarks (21 puntos)
 * @returns true si la mano está cerrada
 */
export function isHandClosed(handLandmarks: HandLandmark[] | null): boolean {
  if (!handLandmarks || handLandmarks.length < 21) return false;

  const wrist = handLandmarks[0]; // Muñeca
  const palm = handLandmarks[9]; // Centro de la palma

  // Puntas de los dedos (índice, medio, anular, meñique)
  const fingerTips = [8, 12, 16, 20];

  // Verificar que las puntas estén cerca de la palma (puño cerrado)
  let closedFingers = 0;

  for (const tipIndex of fingerTips) {
    const tip = handLandmarks[tipIndex];

    // Distancia de punta a palma
    const tipToPalm = distance3D(tip, palm);

    // Distancia de punta a muñeca
    const tipToWrist = distance3D(tip, wrist);

    // Más estricto: ratio de 0.35 en vez de 0.4
    if (tipToPalm < tipToWrist * 0.35) {
      closedFingers++;
    }
  }

  // Verificar pulgar también (más estricto: 0.4 en vez de 0.5)
  const thumbTip = handLandmarks[4];
  const thumbToPalm = distance3D(thumbTip, palm);
  const thumbToWrist = distance3D(thumbTip, wrist);

  if (thumbToPalm < thumbToWrist * 0.4) {
    closedFingers++;
  }

  // MUY ESTRICTO: todos los 5 dedos deben estar cerrados
  return closedFingers >= 5;
}

/**
 * Detecta gesto de pulgar arriba (👍)
 * Para finalizar grabación - más fácil que puño cerrado
 * @param handLandmarks - Array de hand landmarks (21 puntos)
 * @returns true si el pulgar está levantado y los demás dedos cerrados
 */
export function isThumbsUp(handLandmarks: HandLandmark[] | null): boolean {
  if (!handLandmarks || handLandmarks.length < 21) return false;

  const thumbTip = handLandmarks[4];
  const thumbIP = handLandmarks[3];
  const indexTip = handLandmarks[8];
  const middleTip = handLandmarks[12];
  const ringTip = handLandmarks[16];
  const pinkyTip = handLandmarks[20];
  const indexMCP = handLandmarks[5];

  // 1. El pulgar debe estar extendido hacia arriba (más permisivo)
  const thumbExtended = thumbTip.y < thumbIP.y;

  // 2. Los otros dedos deben estar doblados (cerca del MCP del índice)
  const indexFolded = distance3D(indexTip, indexMCP) < distance3D(thumbTip, indexMCP) * 0.8;
  const middleFolded = distance3D(middleTip, indexMCP) < distance3D(thumbTip, indexMCP) * 0.8;
  const ringFolded = distance3D(ringTip, indexMCP) < distance3D(thumbTip, indexMCP) * 0.8;
  const pinkyFolded = distance3D(pinkyTip, indexMCP) < distance3D(thumbTip, indexMCP) * 0.8;

  // Al menos 2 de 4 dedos doblados y pulgar extendido (más permisivo)
  const foldedCount = [indexFolded, middleFolded, ringFolded, pinkyFolded].filter(Boolean).length;

  return thumbExtended && foldedCount >= 2;
}
