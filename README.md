# 🏥 UCI Gesture Communication System

> Sistema de comunicación gestual sin contacto para áreas críticas hospitalarias (UCI/Quirófanos) utilizando detección de poses y manos con MediaPipe + Análisis de grafos topológicos.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)

## 📋 Descripción

Sistema innovador que permite a profesionales médicos en áreas estériles comunicarse mediante gestos corporales y de manos, seleccionando palabras clave que se registran y analizan como grafos de interacción en tiempo real.

### 🎯 Problema que Resuelve

En áreas críticas hospitalarias (UCI, quirófanos), el personal médico necesita mantener esterilidad absoluta. Este sistema elimina la necesidad de contacto físico con dispositivos mientras permite comunicación efectiva.

## ✨ Características Principales

- 🤚 **Detección de Postura en L**: Activación/desactivación mediante pose corporal específica
- 👆 **Selección por Gestos**: Puntero virtual con dedo índice + barra de progreso de 3 segundos
- 🔟 **10 Teclas UCI Especializadas**: Comandos médicos críticos pre-configurados
- 📊 **Análisis de Grafos en Tiempo Real**: Métricas topológicas automáticas
- 🎨 **UI/UX Profesional**: Animaciones fluidas con Framer Motion
- 🚫 **100% Sin Contacto**: Mantiene esterilidad completa

## 🚀 Demo Interactiva

```bash
cd gesture-uci-system/frontend
npm install
npm run dev
```

**Controles Demo:**
- `R` - Iniciar grabación (IDLE → RECORDING)
- `S` - Detener y analizar (RECORDING → PROCESSING → DISPLAYING)
- `ESC` - Reset a IDLE
- **Mouse** - Simula punta del dedo índice (mantener sobre tecla 3 segundos para seleccionar)

## 📁 Estructura del Proyecto

```
gesture-uci-system/
├── frontend/                    # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/         # Componentes UI
│   │   │   ├── Camera/        # Video feed y pose overlay
│   │   │   ├── Keyboard/      # Teclado virtual y botones
│   │   │   ├── Analytics/     # Visualización de grafos
│   │   │   └── UI/            # Indicadores de estado
│   │   ├── hooks/             # Custom hooks
│   │   │   ├── useMediaPipe   # Inicialización MediaPipe
│   │   │   ├── usePoseDetection  # Detección L-pose
│   │   │   ├── useHandTracking   # Tracking dedo índice
│   │   │   └── useGraphAnalysis  # Análisis de grafos
│   │   ├── utils/             # Utilidades
│   │   │   ├── geometry.ts    # Cálculo de ángulos
│   │   │   ├── graphEngine.ts # Motor de grafos
│   │   │   └── constants.ts   # Configuración UCI
│   │   ├── store/             # Estado global (Zustand)
│   │   └── types/             # Tipos TypeScript
│   └── public/                # Assets estáticos
├── analysis/                   # Análisis Python + Jupyter
│   ├── notebooks/             # 4 notebooks de análisis
│   │   ├── 01_topology_analysis.ipynb
│   │   ├── 02_community_detection.ipynb
│   │   ├── 03_diffusion_model.ipynb
│   │   └── 04_resilience_analysis.ipynb
│   ├── src/                   # Módulos Python
│   └── data/                  # Datos de ejemplo
└── docs/                       # Documentación técnica
```

## 🛠️ Tecnologías

### Frontend
- **React 18** + **TypeScript** - Framework UI con tipado estático
- **Vite** - Build tool ultrarrápido
- **MediaPipe Tasks Vision** - Detección de pose (33 landmarks) y manos (21 landmarks)
- **Zustand** - State management con FSM
- **Framer Motion** - Animaciones profesionales
- **Tailwind CSS** - Estilos utility-first
- **D3.js** / **ReactFlow** - Visualización de grafos

### Análisis
- **NetworkX** - Análisis de grafos
- **Pandas** / **NumPy** - Procesamiento de datos
- **Plotly** / **Matplotlib** - Visualizaciones interactivas
- **scikit-network** - Algoritmos avanzados (Louvain, etc.)

## 📦 Instalación

### Frontend

```bash
cd gesture-uci-system/frontend
npm install
npm run dev
```

El servidor se iniciará en `http://localhost:3000`

### Análisis Python

```bash
cd gesture-uci-system/analysis
pip install -r requirements.txt
jupyter lab
```

## 🎮 Cómo Usar

### Modo Demo (Mouse)

1. **Abrir aplicación**: `npm run dev`
2. **Presionar `R`**: Activar modo RECORDING
3. **Mover mouse**: Sobre teclas virtuales (10 comandos médicos)
4. **Mantener hover 3 segundos**: Seleccionar tecla
5. **Presionar `S`**: Finalizar y analizar
6. **Ver métricas**: Densidad, diámetro, comunidades, centralidad
7. **Presionar `ESC`**: Reset

### Modo Producción (MediaPipe)

1. **Postura en L (brazo izquierdo)**: Activar RECORDING
2. **Dedo índice**: Apuntar a teclas virtuales
3. **Mantener 3 segundos**: Confirmar selección
4. **Postura en L (brazo derecho)**: Finalizar y analizar
5. **Ver grafo**: Análisis topológico automático

## 📊 Análisis de Grafos

El sistema calcula en tiempo real:

- **Degree Centrality**: Nodos más conectados
- **Betweenness Centrality**: Nodos intermediarios clave
- **Network Density**: Proporción de conexiones
- **Network Diameter**: Distancia máxima entre nodos
- **Community Detection**: Clustering de teclas frecuentemente usadas juntas (Louvain)

### Exportar Datos

Los datos de interacción se exportan en formato JSON para análisis en Google Colab:

```javascript
// En el frontend
const exportData = () => {
  const json = useAppStore.getState().graph.exportToJSON();
  // Descargar o enviar a backend
};
```

## 📝 10 Teclas UCI Configuradas

| ID | Comando | Color | Uso |
|----|---------|-------|-----|
| T1 | Alerta respiratoria | 🔴 Rojo | Emergencias respiratorias |
| T2 | Alerta cardíaca | 🟠 Naranja | Emergencias cardíacas |
| T3 | Fármacos urgentes | 🟣 Púrpura | Solicitud de medicación |
| T4 | Material estéril | 🔵 Cian | Instrumental adicional |
| T5 | Equipo quirúrgico | 🟢 Verde | Equipo especializado |
| T6 | Sedación necesaria | 🔵 Índigo | Control de sedación |
| T7 | Hemodinamia | 🔴 Rosa | Monitoreo hemodinámico |
| T8 | Soporte ECMO | 🟠 Ámbar | Oxigenación extracorpórea |
| T9 | Aislamiento urgente | 🟢 Teal | Protocolos de aislamiento |
| T10 | Apoyo inmediato | 🟢 Lima | Asistencia general |

## 🚀 Deployment

### Netlify (Automático)

```bash
npm run build
netlify deploy --prod
```

### Manual

```bash
cd frontend
npm run build
# Subir carpeta dist/ a cualquier hosting estático
```

Ver [DEPLOYMENT.md](docs/DEPLOYMENT.md) para guía completa.

## 📚 Documentación

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Arquitectura del sistema FSM
- [MEDIAPIPE_LANDMARKS.md](docs/MEDIAPIPE_LANDMARKS.md) - Referencia de 33+21 landmarks
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) - Guía de deployment
- [API_REFERENCE.md](docs/API_REFERENCE.md) - Referencia completa de API

## 🧪 Testing

```bash
# Frontend
npm run lint
npm run build  # Verifica compilación TypeScript

# Python
cd analysis
pytest
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/amazing`)
3. Commit cambios (`git commit -m 'Add amazing feature'`)
4. Push al branch (`git push origin feature/amazing`)
5. Abrir Pull Request

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE)

## 🎓 Contexto Académico

Proyecto desarrollado como sistema de comunicación gestual para áreas críticas hospitalarias, combinando:
- **Computer Vision** (MediaPipe)
- **Graph Theory** (NetworkX)
- **State Machines** (FSM)
- **UI/UX Design** (Framer Motion)

## 🌟 Características Técnicas Destacadas

- ✅ FSM completo (IDLE → RECORDING → PROCESSING → DISPLAYING)
- ✅ Detección de ángulos con producto punto (90° ± 15°)
- ✅ Algoritmo de Brandes para betweenness centrality
- ✅ Detección de comunidades con Louvain modificado
- ✅ Animaciones 60 FPS con requestAnimationFrame
- ✅ Barra de progreso circular con SVG
- ✅ TypeScript strict mode
- ✅ Responsive y optimizado

## 📧 Contacto

Para más información, consultar documentación técnica en `/docs`.

---

**Hecho con ❤️ para mejorar la comunicación en áreas críticas hospitalarias**
