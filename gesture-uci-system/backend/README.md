# DOCommunication Backend

Sistema de backend en Python para análisis de interacciones gestuales en UCI (Unidad de Cuidados Intensivos).

## 📋 Objetivo del Proyecto

DOCommunication es un sistema de comunicación no verbal para pacientes en UCI que no pueden hablar. El backend Python proporciona:

- **Detección de gestos** usando MediaPipe (pose + manos)
- **Análisis de grafos** de interacciones usando NetworkX
- **API REST** para integración con frontend
- **Visualizaciones** de patrones de comunicación
- **Modelos de ML** para análisis avanzado

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/TS)                      │
│              Deployed en Netlify                            │
│      - Detección de gestos en tiempo real                  │
│      - UI de selección de palabras                         │
│      - Visualización básica de grafos                      │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP REST API
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              BACKEND (Python/FastAPI)                       │
│      - API REST para gestión de sesiones                   │
│      - Análisis avanzado de grafos                         │
│      - Modelos de difusión                                 │
│      - Detección de comunidades                            │
│      - Cálculo de métricas                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┴──────────────┐
         │                            │
┌────────▼─────────┐       ┌─────────▼──────────┐
│   MediaPipe      │       │    NetworkX        │
│   - Pose (33)    │       │    - Grafos        │
│   - Hands (21)   │       │    - Centralidades │
│   - Gestos       │       │    - Comunidades   │
└──────────────────┘       │    - Robustez      │
                          │    - Difusión      │
                          └────────────────────┘
```

## 📁 Estructura del Repositorio

```
backend/
├── src/
│   ├── api/                    # API REST con FastAPI
│   │   ├── __init__.py
│   │   └── main.py            # Endpoints principales
│   │
│   ├── models/                 # Modelos de datos (Pydantic)
│   │   ├── __init__.py
│   │   ├── gesture.py         # GestureState, LandmarkData
│   │   └── session.py         # Session, GraphMetrics
│   │
│   ├── graph/                  # Análisis de grafos
│   │   ├── __init__.py
│   │   └── analyzer.py        # InteractionGraphAnalyzer
│   │
│   ├── vision/                 # Detección de gestos
│   │   ├── __init__.py
│   │   ├── detector.py        # GestureDetector (MediaPipe)
│   │   └── geometry.py        # GeometryUtils
│   │
│   └── utils/                  # Utilidades
│       ├── __init__.py
│       └── data_generator.py  # Generación de datos simulados
│
├── notebooks/
│   └── main.ipynb             # Jupyter notebook principal
│
├── data/
│   └── simulate_data.py       # Script para generar datos
│
├── visualizations/            # Gráficos generados
│
├── tests/                     # Tests unitarios
│
├── main.py                    # Script principal
├── requirements.txt           # Dependencias
└── README.md                  # Este archivo
```

## 🚀 Instalación

### Requisitos Previos

- Python 3.10 o superior
- pip
- Cámara web (para detección en tiempo real)

### Pasos de Instalación

1. **Clonar el repositorio**

```bash
cd gesture-uci-system/backend
```

2. **Crear entorno virtual** (recomendado)

```bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

3. **Instalar dependencias**

```bash
pip install -r requirements.txt
```

## 💻 Uso

El sistema ofrece 3 modos de ejecución:

### 1. API REST (para integración con frontend)

Inicia el servidor API en `http://localhost:8000`:

```bash
python main.py api
```

Endpoints disponibles:
- `GET /` - Información de la API
- `GET /health` - Health check
- `POST /api/sessions` - Crear sesión
- `POST /api/sessions/{id}/interactions` - Agregar interacción
- `GET /api/sessions/{id}/metrics` - Obtener métricas
- `GET /api/sessions` - Listar sesiones

Documentación interactiva: http://localhost:8000/docs

### 2. Demo de Análisis de Grafos

Ejecuta análisis completo con datos simulados:

```bash
python main.py demo
```

Esto generará:
- Análisis de métricas estructurales
- Cálculo de centralidades
- Detección de comunidades
- Análisis de robustez
- Análisis de transiciones
- Modelos de difusión
- Visualización del grafo en `visualizations/demo_graph.png`

### 3. Detección con Cámara

Detección de gestos en tiempo real:

```bash
python main.py camera
```

Controles:
- **ESC**: Salir
- **ESPACIO**: Capturar frame

## 📊 Jupyter Notebook

Para análisis interactivo:

```bash
jupyter notebook notebooks/main.ipynb
```

El notebook incluye:
1. Configuración e imports
2. Generación de datos simulados
3. Construcción del grafo
4. Análisis de métricas estructurales
5. Análisis de centralidades
6. Detección de comunidades
7. Análisis de robustez
8. Análisis de transiciones
9. Modelos de difusión
10. Visualizaciones completas

## 🔬 Métricas Implementadas

### Métricas Estructurales
- **Densidad**: Proporción de conexiones existentes vs posibles
- **Diámetro**: Camino más largo entre dos nodos
- **Camino promedio**: Distancia promedio entre nodos
- **Clustering**: Tendencia a formar grupos

### Centralidades (5 tipos)
1. **Degree Centrality**: Número de conexiones
2. **Betweenness Centrality**: Frecuencia en caminos más cortos
3. **Closeness Centrality**: Cercanía promedio a otros nodos
4. **Eigenvector Centrality**: Importancia basada en vecinos importantes
5. **PageRank**: Algoritmo de Google adaptado a grafos

### Detección de Comunidades
- **Algoritmo**: Louvain
- **Métrica**: Modularidad
- **Output**: Grupos de palabras relacionadas

### Robustez
- **Nodos críticos**: Identificación via betweenness
- **Vulnerability score**: Impacto de remover nodos
- **Connectivity loss**: Pérdida de conectividad

### Análisis de Transiciones
- **Matriz de transición**: Probabilidades entre palabras
- **Entropía de Shannon**: Predictibilidad de secuencias
- **Burstiness**: Regularidad temporal
- **Caminos comunes**: Secuencias frecuentes

### Modelos de Difusión
- **Independent Cascade**: Simulación de propagación
- **Spread Potential**: Alcance esperado por nodo
- **Influence Maximizers**: Nodos más influyentes

## 📡 API REST - Ejemplos de Uso

### Crear sesión

```bash
curl -X POST http://localhost:8000/api/sessions
```

Respuesta:
```json
{
  "session_id": "123e4567-e89b-12d3-a456-426614174000",
  "start_time": "2024-01-15T10:30:00"
}
```

### Agregar interacción

```bash
curl -X POST http://localhost:8000/api/sessions/{session_id}/interactions \
  -H "Content-Type: application/json" \
  -d '{
    "from_node": "DOLOR",
    "to_node": "AYUDA",
    "timestamp": 1705315800.0,
    "duration": 2.5,
    "session_id": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

### Obtener métricas

```bash
curl http://localhost:8000/api/sessions/{session_id}/metrics
```

## 🧪 Generar Datos Simulados

```bash
# Datos aleatorios
python data/simulate_data.py --type random --num 100 --output data/random.json

# Secuencia realista
python data/simulate_data.py --type realistic --output data/realistic.json

# Basado en comunidades
python data/simulate_data.py --type community --output data/community.json
```

## 🔧 Tecnologías Utilizadas

### Visión por Computadora
- **OpenCV** (4.8.1): Captura y procesamiento de video
- **MediaPipe** (0.10.8): Detección de pose y manos

### Análisis de Grafos
- **NetworkX** (3.2.1): Análisis de grafos
- **python-louvain** (0.16): Detección de comunidades

### Ciencia de Datos
- **NumPy** (1.24.3): Cálculos numéricos
- **Pandas** (2.1.4): Manipulación de datos
- **Matplotlib** (3.8.2): Visualizaciones
- **Seaborn** (0.13.0): Visualizaciones avanzadas

### API Backend
- **FastAPI** (0.109.0): Framework web moderno
- **Uvicorn** (0.25.0): Servidor ASGI
- **Pydantic** (2.5.3): Validación de datos

### Notebooks
- **Jupyter** (1.0.0): Análisis interactivo
- **ipykernel** (6.28.0): Kernel de Python

## 📈 Casos de Uso

### 1. Análisis de Patrones de Comunicación

Identificar qué palabras usan más los pacientes y en qué orden:

```python
from src.graph.analyzer import InteractionGraphAnalyzer

analyzer = InteractionGraphAnalyzer()
analyzer.build_from_interactions(interactions)
metrics = analyzer.compute_all_metrics()

# Ver caminos más comunes
print(metrics.transitions.most_common_paths)
# Output: [['DOLOR', 'AYUDA', 'MEDICAMENTO'], ...]
```

### 2. Optimización de Vocabulario

Identificar palabras clave usando centralidades:

```python
# Ordenar por PageRank
important_words = sorted(
    metrics.node_metrics,
    key=lambda x: x.pagerank,
    reverse=True
)[:10]

print([w.node_id for w in important_words])
# Output: ['AYUDA', 'DOLOR', 'AGUA', ...]
```

### 3. Predicción de Próxima Palabra

Usar matriz de transiciones para sugerir palabras:

```python
current_word = "DOLOR"
next_words = metrics.transitions.transition_matrix[current_word]

# Ordenar por probabilidad
suggestions = sorted(
    next_words.items(),
    key=lambda x: x[1],
    reverse=True
)

print(suggestions[:3])
# Output: [('AYUDA', 0.6), ('MEDICAMENTO', 0.3), ...]
```

### 4. Detección de Gestos Personalizada

Agregar nuevos gestos:

```python
from src.vision.geometry import GeometryUtils

class CustomGestures(GeometryUtils):
    @classmethod
    def detect_wave(cls, hand_landmarks):
        # Implementar detección de saludo
        pass
```

## 🧪 Testing

Ejecutar tests:

```bash
pytest tests/
```

Con cobertura:

```bash
pytest --cov=src tests/
```

## 🐛 Troubleshooting

### Error: "No module named 'mediapipe'"

```bash
pip install mediapipe==0.10.8
```

### Error: "Camera not found"

Verifica que tu cámara esté conectada y no esté siendo usada por otra aplicación.

### Error: "Port 8000 already in use"

```bash
# Cambiar puerto
uvicorn src.api.main:app --port 8001
```

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de código abierto para fines educativos y de investigación.

## 👥 Equipo

Desarrollado para mejorar la comunicación de pacientes en UCI.

## 📧 Contacto

Para preguntas o soporte, abre un issue en GitHub.

---

**DOCommunication** - Mejorando la comunicación en cuidados intensivos 🏥
