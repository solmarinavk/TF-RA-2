# Arquitectura del Sistema

## Visión General

El sistema de comunicación gestual UCI está diseñado como una aplicación web moderna con análisis offline en Python. La arquitectura se divide en tres capas principales:

1. **Frontend**: Aplicación React con detección en tiempo real
2. **Análisis**: Pipeline Python para análisis de grafos
3. **Deployment**: Hosting estático en Netlify

## Frontend Architecture

### Stack Tecnológico

```
React 18 + TypeScript
├── Vite (Build Tool)
├── MediaPipe Tasks Vision (Pose + Hands)
├── Zustand (State Management)
├── Tailwind CSS (Styling)
├── ReactFlow (Graph Visualization)
├── D3.js (Advanced Visualizations)
└── Framer Motion (Animations)
```

### Flujo de Datos

```
Camera Input
    ↓
MediaPipe Processing
    ↓
Pose Detection ──→ L-Pose Validation ──→ System Activation
    ↓
Hand Tracking ──→ Finger Position ──→ Key Selection
    ↓
Interaction Recording ──→ Graph Construction ──→ Metrics Calculation
    ↓
Visualization (ReactFlow/D3)
```

### Componentes Principales

#### 1. Camera Layer
- **CameraFeed**: Captura de video webcam
- **PoseOverlay**: Overlay canvas para landmarks

#### 2. Interaction Layer
- **VirtualKeyboard**: Display de 10 teclas UCI
- **KeyButton**: Botón individual con estado hover
- **SelectionProgress**: Indicador circular de progreso

#### 3. Analytics Layer
- **GraphVisualization**: Visualización interactiva del grafo
- **MetricsPanel**: Display de métricas (centralidad, densidad)
- **MessageDisplay**: Historial de mensajes construidos

#### 4. UI Layer
- **StateIndicator**: Indicador de estado del sistema
- **Instructions**: Guía contextual de uso

### Custom Hooks

```typescript
useMediaPipe()
  ├── Inicializa PoseLandmarker y HandLandmarker
  ├── Gestiona lifecycle de MediaPipe
  └── Retorna detectors configurados

usePoseDetection(detector)
  ├── Detecta landmarks de pose
  ├── Valida postura en L
  └── Retorna estado de activación

useHandTracking(detector)
  ├── Detecta landmarks de manos
  ├── Calcula posición de punta de índice
  └── Retorna coordenadas normalizadas

useGraphAnalysis()
  ├── Construye grafo de interacciones
  ├── Calcula métricas topológicas
  └── Retorna nodos, edges y métricas
```

### Estado Global (Zustand)

```typescript
interface AppState {
  // Sistema
  systemState: SystemState;
  setSystemState: (state: SystemState) => void;

  // Detección
  poseLandmarks: PoseLandmark[] | null;
  handLandmarks: HandLandmark[] | null;

  // Selección
  selectionState: SelectionState;
  updateSelection: (keyId: string | null) => void;

  // Grafo
  graphNodes: KeyNode[];
  graphEdges: GraphEdge[];
  addEdge: (from: string, to: string) => void;

  // Métricas
  metrics: GraphMetrics | null;
  calculateMetrics: () => void;
}
```

## Detección de Gestos

### Postura en L (Activación)

```typescript
function detectLPose(landmarks: PoseLandmark[]): boolean {
  // Brazo izquierdo
  const leftAngle = calculateAngle(
    landmarks[PoseLandmarkIndex.LEFT_SHOULDER],
    landmarks[PoseLandmarkIndex.LEFT_ELBOW],
    landmarks[PoseLandmarkIndex.LEFT_WRIST]
  );

  // Brazo derecho
  const rightAngle = calculateAngle(
    landmarks[PoseLandmarkIndex.RIGHT_SHOULDER],
    landmarks[PoseLandmarkIndex.RIGHT_ELBOW],
    landmarks[PoseLandmarkIndex.RIGHT_WRIST]
  );

  // Validación
  const leftValid = Math.abs(leftAngle - 90) < L_POSE_ANGLE_TOLERANCE;
  const rightValid = Math.abs(rightAngle - 90) < L_POSE_ANGLE_TOLERANCE;

  return leftValid && rightValid;
}
```

### Selección de Teclas

```typescript
function detectKeySelection(
  fingerTip: HandLandmark,
  keys: KeyNode[],
  canvasSize: { width: number; height: number }
): string | null {
  // Convertir coordenadas normalizadas a píxeles
  const fingerX = fingerTip.x * canvasSize.width;
  const fingerY = fingerTip.y * canvasSize.height;

  // Buscar tecla bajo el dedo
  for (const key of keys) {
    const keyX = key.position.x * canvasSize.width;
    const keyY = key.position.y * canvasSize.height;

    const distance = Math.sqrt(
      Math.pow(fingerX - keyX, 2) +
      Math.pow(fingerY - keyY, 2)
    );

    if (distance < key.radius) {
      return key.id;
    }
  }

  return null;
}
```

## Graph Analysis Engine

### Construcción del Grafo

```typescript
interface GraphNode {
  id: string;
  label: string;
  selectionCount: number;
}

interface GraphEdge {
  from: string;
  to: string;
  weight: number; // Número de transiciones
}

function buildGraph(interactions: Selection[]): Graph {
  const edges: Map<string, GraphEdge> = new Map();

  for (let i = 1; i < interactions.length; i++) {
    const from = interactions[i - 1].keyId;
    const to = interactions[i].keyId;
    const edgeKey = `${from}-${to}`;

    if (edges.has(edgeKey)) {
      edges.get(edgeKey)!.weight++;
    } else {
      edges.set(edgeKey, { from, to, weight: 1 });
    }
  }

  return { nodes: UCI_KEYS, edges: Array.from(edges.values()) };
}
```

### Métricas Calculadas

1. **Degree Centrality**: Número de conexiones de cada nodo
2. **Betweenness Centrality**: Cuántas rutas pasan por cada nodo
3. **Network Density**: Proporción de edges actuales vs posibles
4. **Network Diameter**: Distancia máxima entre nodos
5. **Community Detection**: Clustering de teclas frecuentemente usadas juntas

## Python Analysis Pipeline

### Workflow

```
Data Export (JSON)
    ↓
Jupyter Notebooks
    ↓
01_topology_analysis.ipynb ──→ Análisis estructural
02_community_detection.ipynb ──→ Clustering
03_diffusion_model.ipynb ──→ Modelado de propagación
04_resilience_analysis.ipynb ──→ Robustez
    ↓
Visualizaciones (Plotly/Matplotlib)
    ↓
Reportes y Insights
```

### Herramientas

- **NetworkX**: Construcción y análisis de grafos
- **scikit-network**: Algoritmos avanzados (Louvain, etc.)
- **Plotly**: Visualizaciones interactivas
- **Pandas**: Procesamiento de datos temporales

## Deployment (Netlify)

### Build Process

```bash
npm run build
    ↓
TypeScript Compilation (tsc)
    ↓
Vite Build (optimización, bundling)
    ↓
Output: frontend/dist/
    ├── index.html
    ├── assets/
    │   ├── index-[hash].js
    │   └── index-[hash].css
    └── [otros assets]
```

### Configuración Netlify

- **Build Command**: `npm run build`
- **Publish Directory**: `frontend/dist`
- **Node Version**: 18
- **Redirects**: SPA fallback a `index.html`

### Optimizaciones

1. **Code Splitting**: Lazy loading de componentes pesados
2. **Tree Shaking**: Eliminación de código no usado
3. **Asset Optimization**: Compresión de imágenes/fonts
4. **CDN**: MediaPipe models servidos desde CDN oficial

## Consideraciones de Rendimiento

### MediaPipe Optimization

- **FPS Target**: 30 FPS
- **Model Complexity**: LITE para pose, FULL para hands
- **Delegate**: GPU cuando disponible
- **Running Mode**: VIDEO (optimizado para stream)

### React Optimization

- **useMemo**: Cálculos geométricos pesados
- **useCallback**: Event handlers
- **React.memo**: Componentes con props estables
- **Virtualization**: Lista de mensajes larga

### Canvas Rendering

- **RequestAnimationFrame**: Sincronización con refresh rate
- **OffscreenCanvas**: Procesamiento en worker (futuro)
- **Debouncing**: Reducir frecuencia de updates UI

## Seguridad y Privacidad

1. **No hay servidor backend**: Todo en cliente
2. **No se almacenan videos**: Solo landmarks
3. **Datos locales**: Graph data en localStorage opcional
4. **HTTPS obligatorio**: Para acceso a cámara

## Extensibilidad

### Añadir Nuevas Teclas

```typescript
// src/utils/constants.ts
export const UCI_KEYS: KeyNode[] = [
  // ... teclas existentes
  {
    id: 'T11',
    label: 'Nueva función',
    color: '#FF6B6B',
    position: { x: 0.5, y: 0.3 },
    radius: 60,
    selectionCount: 0,
    lastSelected: null
  }
];
```

### Añadir Nuevos Gestos

```typescript
// src/utils/geometry.ts
export function detectCustomGesture(landmarks: PoseLandmark[]): boolean {
  // Implementar lógica de detección
}
```

### Añadir Nuevas Métricas

```python
# analysis/src/metrics_calculator.py
def calculate_custom_metric(G):
    # Implementar cálculo
    pass
```

## Referencias

- [MediaPipe Documentation](https://developers.google.com/mediapipe)
- [React Best Practices](https://react.dev/learn)
- [NetworkX Documentation](https://networkx.org/documentation/stable/)
- [Netlify Deployment](https://docs.netlify.com/)
