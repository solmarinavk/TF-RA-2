// IMPORTANTE: Respetar landmarks estándar de MediaPipe
// Pose: 33 landmarks (0-32)
// Hands: 21 landmarks por mano (0-20)

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

// Índices estándar MediaPipe Pose (33 puntos)
export enum PoseLandmarkIndex {
  NOSE = 0,
  LEFT_EYE_INNER = 1,
  LEFT_EYE = 2,
  LEFT_EYE_OUTER = 3,
  RIGHT_EYE_INNER = 4,
  RIGHT_EYE = 5,
  RIGHT_EYE_OUTER = 6,
  LEFT_EAR = 7,
  RIGHT_EAR = 8,
  MOUTH_LEFT = 9,
  MOUTH_RIGHT = 10,
  LEFT_SHOULDER = 11,
  RIGHT_SHOULDER = 12,
  LEFT_ELBOW = 13,
  RIGHT_ELBOW = 14,
  LEFT_WRIST = 15,
  RIGHT_WRIST = 16,
  LEFT_PINKY = 17,
  RIGHT_PINKY = 18,
  LEFT_INDEX = 19,
  RIGHT_INDEX = 20,
  LEFT_THUMB = 21,
  RIGHT_THUMB = 22,
  LEFT_HIP = 23,
  RIGHT_HIP = 24,
  LEFT_KNEE = 25,
  RIGHT_KNEE = 26,
  LEFT_ANKLE = 27,
  RIGHT_ANKLE = 28,
  LEFT_HEEL = 29,
  RIGHT_HEEL = 30,
  LEFT_FOOT_INDEX = 31,
  RIGHT_FOOT_INDEX = 32
}

// Índices estándar MediaPipe Hands (21 puntos por mano)
export enum HandLandmarkIndex {
  WRIST = 0,
  THUMB_CMC = 1,
  THUMB_MCP = 2,
  THUMB_IP = 3,
  THUMB_TIP = 4,
  INDEX_FINGER_MCP = 5,
  INDEX_FINGER_PIP = 6,
  INDEX_FINGER_DIP = 7,
  INDEX_FINGER_TIP = 8,
  MIDDLE_FINGER_MCP = 9,
  MIDDLE_FINGER_PIP = 10,
  MIDDLE_FINGER_DIP = 11,
  MIDDLE_FINGER_TIP = 12,
  RING_FINGER_MCP = 13,
  RING_FINGER_PIP = 14,
  RING_FINGER_DIP = 15,
  RING_FINGER_TIP = 16,
  PINKY_MCP = 17,
  PINKY_PIP = 18,
  PINKY_DIP = 19,
  PINKY_TIP = 20
}

export type SystemState = 'IDLE' | 'RECORDING' | 'PROCESSING' | 'DISPLAYING';

export interface KeyNode {
  id: string;
  label: string;
  color: string;
  position: { x: number; y: number };
  radius: number;
  selectionCount: number;
  lastSelected: number | null;
}

export interface GraphEdge {
  from: string;
  to: string;
  weight: number;
  timestamp: number;
}

export interface SelectionState {
  hoveredKey: string | null;
  hoverStartTime: number | null;
  hoverProgress: number;
  isSelecting: boolean;
}

export interface GraphMetrics {
  // Centralidades
  degreeCentrality: Record<string, number>;
  betweennessCentrality: Record<string, number>;
  closenessCentrality: Record<string, number>;
  eigenvectorCentrality: Record<string, number>;
  pageRank: Record<string, number>;

  // Métricas topológicas
  density: number;
  diameter: number | null;
  averagePathLength: number | null;
  clusteringCoefficient: number;

  // Comunidades
  communities: Record<number, string[]>;
  modularity: number;

  // Robustez
  robustness: {
    criticalNodes: string[];          // Nodos cuya eliminación fragmenta más la red
    vulnerabilityScore: number;       // 0-1, qué tan vulnerable es la red
    connectivityAfterRemoval: number; // Conectividad si se elimina el nodo más crítico
  };

  // Análisis de transiciones
  transitions: {
    mostCommonPath: string[];         // Secuencia más frecuente
    transitionMatrix: Record<string, Record<string, number>>; // Probabilidades de transición
    entropy: number;                  // Entropía de las transiciones (predictibilidad)
    burstiness: number;               // Irregularidad temporal
  };

  // Modelo de difusión
  diffusion: {
    spreadPotential: Record<string, number>;  // Potencial de cada nodo para difundir
    activationThreshold: number;              // Umbral promedio de activación
    cascadeSize: number;                      // Tamaño esperado de cascada desde nodo central
  };
}
