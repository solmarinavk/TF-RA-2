# UCI Gesture Communication System

Sistema de comunicación gestual sin contacto para áreas críticas hospitalarias (UCI/Quirófanos) utilizando detección de poses y manos con MediaPipe.

## Descripción

Este sistema permite a profesionales médicos en áreas estériles comunicarse mediante gestos corporales y de manos, seleccionando palabras clave que se registran y analizan como grafos de interacción.

## Características Principales

- **Detección de Postura en L**: Activación del sistema mediante postura corporal específica
- **Selección por Gestos de Mano**: Selección de teclas virtuales mediante puntero de dedo índice
- **10 Teclas UCI Especializadas**: Comandos médicos críticos pre-configurados
- **Análisis de Grafos**: Análisis topológico de patrones de interacción
- **Sin Contacto**: 100% libre de contacto físico para mantener esterilidad

## Estructura del Proyecto

```
gesture-uci-system/
├── frontend/          # Aplicación React + TypeScript + Vite
│   ├── src/
│   │   ├── components/  # Componentes UI
│   │   ├── hooks/       # Custom hooks
│   │   ├── utils/       # Utilidades y lógica
│   │   ├── types/       # Definiciones TypeScript
│   │   ├── store/       # Estado global (Zustand)
│   │   └── styles/      # Estilos Tailwind
│   └── public/        # Archivos estáticos
├── analysis/          # Análisis Python + Jupyter
│   ├── notebooks/     # Notebooks de análisis
│   ├── src/          # Código Python
│   └── data/         # Datos de ejemplo
└── docs/             # Documentación
```

## Requisitos

### Frontend
- Node.js 18+
- npm o yarn

### Análisis
- Python 3.11+
- Jupyter Lab

## Instalación

### Frontend

```bash
cd frontend
npm install
npm run dev
```

El servidor se iniciará en `http://localhost:3000`

### Análisis Python

```bash
cd analysis
pip install -r requirements.txt
jupyter lab
```

## Tecnologías

### Frontend
- **React 18**: Framework UI
- **TypeScript**: Tipado estático
- **Vite**: Build tool
- **MediaPipe Tasks Vision**: Detección de pose y manos
- **Zustand**: State management
- **Tailwind CSS**: Estilos
- **ReactFlow**: Visualización de grafos
- **D3.js**: Visualizaciones avanzadas
- **Framer Motion**: Animaciones

### Análisis
- **NetworkX**: Análisis de grafos
- **Pandas/NumPy**: Procesamiento de datos
- **Plotly/Matplotlib**: Visualizaciones
- **scikit-network**: Algoritmos de grafos avanzados

## Documentación

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Arquitectura del sistema
- [MEDIAPIPE_LANDMARKS.md](docs/MEDIAPIPE_LANDMARKS.md) - Referencia de landmarks
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) - Guía de deployment
- [API_REFERENCE.md](docs/API_REFERENCE.md) - Referencia de API

## Deployment

Este proyecto está configurado para deployment en Netlify:

```bash
npm run build
```

Ver [DEPLOYMENT.md](docs/DEPLOYMENT.md) para más detalles.

## Licencia

MIT License - Ver [LICENSE](LICENSE)

## Contacto

Para más información sobre el proyecto, consultar la documentación técnica en `/docs`.
