# API Reference

## TypeScript Types

### Core Types

#### PoseLandmark

```typescript
interface PoseLandmark {
  x: number;        // Coordenada X normalizada (0.0 - 1.0)
  y: number;        // Coordenada Y normalizada (0.0 - 1.0)
  z: number;        // Profundidad relativa
  visibility?: number;  // Confianza de visibilidad (0.0 - 1.0)
}
```

#### HandLandmark

```typescript
interface HandLandmark {
  x: number;        // Coordenada X normalizada (0.0 - 1.0)
  y: number;        // Coordenada Y normalizada (0.0 - 1.0)
  z: number;        // Profundidad relativa
}
```

#### KeyNode

```typescript
interface KeyNode {
  id: string;                     // Identificador único (ej: "T1")
  label: string;                  // Texto de la tecla
  color: string;                  // Color hex
  position: { x: number; y: number };  // Posición normalizada
  radius: number;                 // Radio en píxeles
  selectionCount: number;         // Contador de selecciones
  lastSelected: number | null;    // Timestamp última selección
}
```

#### GraphEdge

```typescript
interface GraphEdge {
  from: string;      // ID de nodo origen
  to: string;        // ID de nodo destino
  weight: number;    // Peso/frecuencia de transición
  timestamp: number; // Timestamp de creación
}
```

#### SelectionState

```typescript
interface SelectionState {
  hoveredKey: string | null;      // ID de tecla bajo hover
  hoverStartTime: number | null;  // Timestamp inicio hover
  hoverProgress: number;          // Progreso 0.0 - 1.0
  isSelecting: boolean;           // Está en proceso de selección
}
```

#### GraphMetrics

```typescript
interface GraphMetrics {
  degreeCentrality: Record<string, number>;      // Centralidad por grado
  betweennessCentrality: Record<string, number>; // Centralidad intermediación
  density: number;                                // Densidad de red (0.0 - 1.0)
  diameter: number | null;                        // Diámetro de red
  communities: Record<number, string[]>;          // Comunidades detectadas
}
```

### Enums

#### PoseLandmarkIndex

```typescript
enum PoseLandmarkIndex {
  NOSE = 0,
  LEFT_EYE_INNER = 1,
  LEFT_EYE = 2,
  // ... (ver MEDIAPIPE_LANDMARKS.md para lista completa)
  LEFT_SHOULDER = 11,
  RIGHT_SHOULDER = 12,
  LEFT_ELBOW = 13,
  RIGHT_ELBOW = 14,
  LEFT_WRIST = 15,
  RIGHT_WRIST = 16,
  // ...
}
```

#### HandLandmarkIndex

```typescript
enum HandLandmarkIndex {
  WRIST = 0,
  THUMB_CMC = 1,
  THUMB_MCP = 2,
  // ... (ver MEDIAPIPE_LANDMARKS.md para lista completa)
  INDEX_FINGER_TIP = 8,
  // ...
}
```

#### SystemState

```typescript
type SystemState = 'IDLE' | 'RECORDING' | 'PROCESSING' | 'DISPLAYING';
```

## Utility Functions

### Geometry Utils

#### calculateAngle

```typescript
/**
 * Calcula el ángulo entre tres puntos
 * @param p1 - Primer punto (hombro)
 * @param p2 - Punto medio (codo)
 * @param p3 - Tercer punto (muñeca)
 * @returns Ángulo en grados (0-180)
 */
function calculateAngle(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number }
): number
```

**Ejemplo:**
```typescript
const angle = calculateAngle(
  landmarks[PoseLandmarkIndex.LEFT_SHOULDER],
  landmarks[PoseLandmarkIndex.LEFT_ELBOW],
  landmarks[PoseLandmarkIndex.LEFT_WRIST]
);
```

#### calculateDistance

```typescript
/**
 * Calcula distancia euclidiana entre dos puntos
 * @param p1 - Primer punto
 * @param p2 - Segundo punto
 * @returns Distancia
 */
function calculateDistance(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number
```

#### normalizeToPixels

```typescript
/**
 * Convierte coordenadas normalizadas a píxeles
 * @param normalized - Coordenadas normalizadas (0.0 - 1.0)
 * @param dimensions - Dimensiones del canvas
 * @returns Coordenadas en píxeles
 */
function normalizeToPixels(
  normalized: { x: number; y: number },
  dimensions: { width: number; height: number }
): { x: number; y: number }
```

#### detectLPose

```typescript
/**
 * Detecta si el usuario está en postura L
 * @param landmarks - Array de pose landmarks
 * @returns true si detecta postura L válida
 */
function detectLPose(landmarks: PoseLandmark[]): boolean
```

### Graph Utils

#### buildGraph

```typescript
/**
 * Construye grafo desde lista de selecciones
 * @param selections - Array de selecciones ordenadas temporalmente
 * @returns Grafo con nodos y edges
 */
function buildGraph(selections: Array<{ keyId: string; timestamp: number }>): {
  nodes: KeyNode[];
  edges: GraphEdge[];
}
```

#### calculateDegreeCentrality

```typescript
/**
 * Calcula centralidad por grado
 * @param graph - Grafo de interacciones
 * @returns Mapa de nodo ID a centralidad
 */
function calculateDegreeCentrality(graph: {
  nodes: KeyNode[];
  edges: GraphEdge[];
}): Record<string, number>
```

#### calculateBetweennessCentrality

```typescript
/**
 * Calcula centralidad de intermediación
 * @param graph - Grafo de interacciones
 * @returns Mapa de nodo ID a centralidad
 */
function calculateBetweennessCentrality(graph: {
  nodes: KeyNode[];
  edges: GraphEdge[];
}): Record<string, number>
```

#### calculateNetworkDensity

```typescript
/**
 * Calcula densidad de la red
 * @param graph - Grafo de interacciones
 * @returns Densidad (0.0 - 1.0)
 */
function calculateNetworkDensity(graph: {
  nodes: KeyNode[];
  edges: GraphEdge[];
}): number
```

## Custom Hooks

### useMediaPipe

```typescript
/**
 * Hook para inicializar MediaPipe vision tasks
 * @returns Detectores de pose y manos
 */
function useMediaPipe(): {
  poseDetector: PoseLandmarker | null;
  handDetector: HandLandmarker | null;
  isLoading: boolean;
  error: Error | null;
}
```

**Uso:**
```typescript
const { poseDetector, handDetector, isLoading } = useMediaPipe();

useEffect(() => {
  if (poseDetector && videoElement) {
    // Detectar pose
    const results = poseDetector.detect(videoElement);
  }
}, [poseDetector, videoElement]);
```

### usePoseDetection

```typescript
/**
 * Hook para detectar postura L
 * @param detector - PoseLandmarker de MediaPipe
 * @param videoElement - Elemento video para procesar
 * @returns Estado de postura L
 */
function usePoseDetection(
  detector: PoseLandmarker | null,
  videoElement: HTMLVideoElement | null
): {
  isLPose: boolean;
  landmarks: PoseLandmark[] | null;
  confidence: number;
}
```

### useHandTracking

```typescript
/**
 * Hook para tracking de manos
 * @param detector - HandLandmarker de MediaPipe
 * @param videoElement - Elemento video para procesar
 * @returns Landmarks de manos y punta de índice
 */
function useHandTracking(
  detector: HandLandmarker | null,
  videoElement: HTMLVideoElement | null
): {
  landmarks: HandLandmark[] | null;
  indexFingerTip: { x: number; y: number } | null;
  handedness: 'Left' | 'Right' | null;
}
```

### useGraphAnalysis

```typescript
/**
 * Hook para análisis de grafo
 * @param selections - Array de selecciones
 * @returns Grafo y métricas calculadas
 */
function useGraphAnalysis(
  selections: Array<{ keyId: string; timestamp: number }>
): {
  graph: { nodes: KeyNode[]; edges: GraphEdge[] };
  metrics: GraphMetrics;
  recalculate: () => void;
}
```

## Constants

### UCI_KEYS

```typescript
const UCI_KEYS: KeyNode[] = [
  { id: 'T1', label: 'Alerta respiratoria', color: '#EF4444', ... },
  { id: 'T2', label: 'Alerta cardíaca', color: '#F59E0B', ... },
  // ... 10 teclas totales
]
```

### Thresholds

```typescript
const SELECTION_DURATION = 3000;        // ms para confirmar selección
const PROXIMITY_THRESHOLD = 80;         // píxeles
const HOVER_THRESHOLD = 60;             // píxeles
const L_POSE_ANGLE_TOLERANCE = 15;      // grados
const L_POSE_DURATION = 1500;           // ms para confirmar postura
const FPS_TARGET = 30;                  // frames por segundo objetivo
```

## Zustand Store

### AppStore

```typescript
interface AppStore {
  // Estado del sistema
  systemState: SystemState;
  setSystemState: (state: SystemState) => void;

  // Detección
  poseLandmarks: PoseLandmark[] | null;
  handLandmarks: HandLandmark[] | null;
  updateLandmarks: (pose: PoseLandmark[] | null, hand: HandLandmark[] | null) => void;

  // Selección
  selectionState: SelectionState;
  startHover: (keyId: string) => void;
  updateHoverProgress: (progress: number) => void;
  completeSelection: () => void;
  cancelHover: () => void;

  // Grafo
  graphNodes: KeyNode[];
  graphEdges: GraphEdge[];
  addSelection: (keyId: string) => void;
  clearGraph: () => void;

  // Métricas
  metrics: GraphMetrics | null;
  calculateMetrics: () => void;

  // Mensajes
  messages: string[];
  currentMessage: string;
  addWord: (word: string) => void;
  completeMessage: () => void;
  clearMessages: () => void;
}
```

**Uso:**
```typescript
import { useAppStore } from '@/store/useAppStore';

function MyComponent() {
  const systemState = useAppStore((state) => state.systemState);
  const setSystemState = useAppStore((state) => state.setSystemState);

  const activateRecording = () => {
    setSystemState('RECORDING');
  };

  return <button onClick={activateRecording}>Start</button>;
}
```

## MediaPipe Configuration

### PoseLandmarker Options

```typescript
{
  baseOptions: {
    modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
    delegate: 'GPU'
  },
  runningMode: 'VIDEO',
  numPoses: 1,
  minPoseDetectionConfidence: 0.5,
  minPosePresenceConfidence: 0.5,
  minTrackingConfidence: 0.5
}
```

### HandLandmarker Options

```typescript
{
  baseOptions: {
    modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
    delegate: 'GPU'
  },
  runningMode: 'VIDEO',
  numHands: 2,
  minHandDetectionConfidence: 0.5,
  minHandPresenceConfidence: 0.5,
  minTrackingConfidence: 0.5
}
```

## Python API (Analysis)

### GraphAnalyzer

```python
class GraphAnalyzer:
    def __init__(self, interactions: List[Dict]):
        """Inicializa analizador con datos de interacciones"""

    def build_graph(self) -> nx.Graph:
        """Construye NetworkX graph desde interacciones"""

    def calculate_metrics(self) -> Dict:
        """Calcula todas las métricas de grafo"""

    def detect_communities(self) -> Dict[int, List[str]]:
        """Detecta comunidades usando Louvain"""

    def export_visualization(self, output_path: str):
        """Exporta visualización Plotly"""
```

### MetricsCalculator

```python
class MetricsCalculator:
    @staticmethod
    def degree_centrality(G: nx.Graph) -> Dict[str, float]:
        """Calcula degree centrality"""

    @staticmethod
    def betweenness_centrality(G: nx.Graph) -> Dict[str, float]:
        """Calcula betweenness centrality"""

    @staticmethod
    def network_density(G: nx.Graph) -> float:
        """Calcula densidad de red"""

    @staticmethod
    def network_diameter(G: nx.Graph) -> int | None:
        """Calcula diámetro de red"""
```

## Event System

### Custom Events

```typescript
// Evento de selección completada
const selectionEvent = new CustomEvent('keyselected', {
  detail: { keyId: 'T1', timestamp: Date.now() }
});
window.dispatchEvent(selectionEvent);

// Listener
window.addEventListener('keyselected', (e) => {
  console.log('Key selected:', e.detail);
});
```

## Error Handling

### MediaPipe Errors

```typescript
try {
  const results = await poseDetector.detect(videoElement);
} catch (error) {
  if (error instanceof Error) {
    console.error('MediaPipe detection error:', error.message);
    // Fallback o retry logic
  }
}
```

### Camera Permissions

```typescript
try {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 1280, height: 720, facingMode: 'user' }
  });
} catch (error) {
  if (error.name === 'NotAllowedError') {
    // Usuario denegó permisos
  } else if (error.name === 'NotFoundError') {
    // No hay cámara disponible
  }
}
```

## Performance Monitoring

```typescript
// Medir FPS
let frameCount = 0;
let lastTime = performance.now();

function measureFPS() {
  frameCount++;
  const currentTime = performance.now();

  if (currentTime - lastTime >= 1000) {
    const fps = frameCount;
    console.log('FPS:', fps);
    frameCount = 0;
    lastTime = currentTime;
  }
}
```
