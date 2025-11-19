import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import './styles/globals.css';
import { useAppStore } from './store/useAppStore';
import { UCI_KEYS } from './utils/constants';
import { VirtualKeyboard } from './components/Keyboard/VirtualKeyboard';
import { StateIndicator } from './components/UI/StateIndicator';
import { CameraFeed } from './components/Camera/CameraFeed';
import { LandmarksOverlay } from './components/Camera/LandmarksOverlay';
import { useMediaPipe } from './hooks/useMediaPipe';
import { useGestureDetection } from './hooks/useGestureDetection';
import { useHandTracking } from './hooks/useHandTracking';

function App() {
  const {
    systemState,
    hoveredKey,
    hoverProgress,
    currentMessage,
    selectedKeys,
    metrics,
    graph,
    resetSession
  } = useAppStore();

  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Inicializar MediaPipe
  const { poseLandmarker, handLandmarker, isLoading, error, isReady } = useMediaPipe();

  // Hooks de detección
  useGestureDetection(poseLandmarker, handLandmarker, videoElement);
  const { fingerPosition } = useHandTracking(handLandmarker, videoElement, canvasSize);

  // Actualizar tamaño de canvas en resize
  useEffect(() => {
    const handleResize = () => {
      setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Controles de teclado para FSM (fallback)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          resetSession();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [resetSession]);

  // Pantalla de carga
  if (isLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🤖</div>
          <div className="text-white text-2xl font-bold mb-2">Cargando MediaPipe...</div>
          <div className="text-gray-400">Inicializando detección de poses y manos</div>
        </div>
      </div>
    );
  }

  // Pantalla de error
  if (error) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-white text-2xl font-bold mb-2">Error de Inicialización</div>
          <div className="text-gray-400">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Video de cámara */}
      <CameraFeed onVideoReady={setVideoElement} />

      {/* Overlay de landmarks (puntos detectados) */}
      <LandmarksOverlay canvasSize={canvasSize} />

      {/* Título y logo */}
      <div className="fixed top-6 left-6 z-40">
        <h1 className="text-2xl font-black text-white drop-shadow-lg">
          UCI Gesture System
        </h1>
        <p className="text-xs text-gray-400 mt-1">Sistema de Comunicación Gestual Hospitalaria</p>
      </div>

      {/* Indicador de estado */}
      <StateIndicator state={systemState} />

      {/* Panel de instrucciones */}
      <div className="fixed bottom-6 left-6 z-40 bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-lg p-4 text-white text-sm space-y-2 max-w-xs">
        <div className="font-bold mb-3">📖 Instrucciones:</div>
        <div>🖐️ <strong>Brazo en L + palma abierta</strong> - Iniciar</div>
        <div>👉 <strong>Dedo índice</strong> - Apuntar a teclas</div>
        <div>⏱️ <strong>Mantener 3 segundos</strong> - Confirmar</div>
        <div>✊ <strong>Brazo en L + puño</strong> - Finalizar</div>
        <div className="pt-2 border-t border-gray-700">
          <div className="text-xs text-gray-400">
            {isReady ? '✅ MediaPipe listo' : '⏳ Preparando...'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Los puntos de colores muestran detección en tiempo real
          </div>
        </div>
      </div>

      {/* Panel de mensaje actual */}
      {systemState !== 'IDLE' && (
        <motion.div
          className="fixed top-6 right-6 z-40 bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-lg p-4 text-white min-w-[250px] max-w-[300px]"
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <span>💬</span>
            Mensaje Actual
          </h3>

          {currentMessage.length === 0 ? (
            <div className="text-gray-400 text-sm italic">
              Sin selecciones aún...
            </div>
          ) : (
            <div className="space-y-2">
              {currentMessage.map((word, i) => (
                <motion.div
                  key={i}
                  className="bg-blue-600 px-3 py-2 rounded text-sm"
                  initial={{ scale: 0, x: -20 }}
                  animate={{ scale: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  {i + 1}. {word}
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-400">
            Total selecciones: {selectedKeys.length}
          </div>
        </motion.div>
      )}

      {/* Panel de métricas */}
      {systemState === 'DISPLAYING' && metrics && (
        <motion.div
          className="fixed bottom-6 right-6 z-40 bg-gray-800 bg-opacity-95 backdrop-blur-sm rounded-lg p-6 text-white min-w-[350px]"
          initial={{ y: 400, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <span>📊</span>
            Análisis del Grafo
          </h3>

          <div className="space-y-3 text-sm">
            <div>
              <div className="text-gray-400">Densidad de red:</div>
              <div className="font-mono text-xl text-green-400">{(metrics.density * 100).toFixed(1)}%</div>
            </div>

            <div>
              <div className="text-gray-400">Diámetro:</div>
              <div className="font-mono text-xl text-blue-400">{metrics.diameter ?? 'N/A'}</div>
            </div>

            <div>
              <div className="text-gray-400">Comunidades detectadas:</div>
              <div className="font-mono text-xl text-purple-400">{Object.keys(metrics.communities).length}</div>
            </div>

            <div className="pt-3 border-t border-gray-700">
              <div className="text-gray-400 mb-2">Top 3 nodos centrales:</div>
              {graph.getTopNodes('degree', 3).map((node) => {
                const keyNode = UCI_KEYS.find(k => k.id === node.id);
                return (
                  <div key={node.id} className="flex items-center gap-2 text-xs mb-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: keyNode?.color }}
                    />
                    <span>{keyNode?.label}</span>
                    <span className="text-gray-500">({(node.value * 100).toFixed(0)}%)</span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={resetSession}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold transition-colors"
            >
              Nuevo Mensaje
            </button>
          </div>
        </motion.div>
      )}

      {/* Teclado virtual */}
      <VirtualKeyboard
        keys={graph.nodes.size > 0 ? Array.from(graph.nodes.values()) : UCI_KEYS}
        fingerPosition={fingerPosition}
        canvasSize={canvasSize}
        hoveredKey={hoveredKey}
        hoverProgress={hoverProgress}
        isRecording={systemState === 'RECORDING'}
      />

      {/* Cursor de dedo índice */}
      {systemState === 'RECORDING' && fingerPosition && (
        <motion.div
          className="fixed pointer-events-none z-50"
          style={{
            left: fingerPosition.x,
            top: fingerPosition.y,
            transform: 'translate(-50%, -50%)'
          }}
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity
          }}
        >
          <div className="w-6 h-6 bg-yellow-400 rounded-full border-4 border-white shadow-2xl" />
        </motion.div>
      )}

      {/* Grid de fondo */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%, transparent)
          `,
          backgroundSize: '50px 50px'
        }}
      />
    </div>
  );
}

export default App;
