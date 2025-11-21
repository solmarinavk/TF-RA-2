import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import './styles/globals.css';
import { useAppStore } from './store/useAppStore';
import { UCI_KEYS } from './utils/constants';
import { VirtualKeyboard } from './components/Keyboard/VirtualKeyboard';
import { StateIndicator } from './components/UI/StateIndicator';
import { GestureProgressBar } from './components/UI/GestureProgressBar';
import { MetricsPanel } from './components/UI/MetricsPanel';
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
    gestureProgress,
    gestureType,
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
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="text-6xl mb-6 animate-pulse">🏥</div>
          <div className="text-white text-2xl font-bold mb-3">UCI Gesture System</div>
          <div className="text-slate-400">Inicializando detección de poses y manos...</div>
          <div className="mt-6 w-48 h-1 bg-slate-700 rounded-full overflow-hidden mx-auto">
            <motion.div
              className="h-full bg-blue-500 rounded-full"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de error
  if (error) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center max-w-md px-6">
          <div className="text-6xl mb-6">⚠️</div>
          <div className="text-white text-2xl font-bold mb-3">Error de Inicialización</div>
          <div className="text-slate-400 text-sm">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Video de cámara - fondo semitransparente */}
      <CameraFeed onVideoReady={setVideoElement} />

      {/* Overlay de landmarks (puntos detectados) */}
      <LandmarksOverlay canvasSize={canvasSize} />

      {/* Header minimalista */}
      <header className="fixed top-0 left-0 right-0 z-30 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            UCI Gesture System
          </h1>
          <p className="text-xs text-slate-500">Comunicación Gestual Hospitalaria</p>
        </div>

        {/* Indicador de estado */}
        <StateIndicator state={systemState} />
      </header>

      {/* Área de círculos - centrada horizontalmente */}
      <div className="fixed top-[18%] left-0 right-0 z-20 flex justify-center">
        <div className="relative" style={{ width: '90%', maxWidth: '1400px' }}>
          <VirtualKeyboard
            keys={graph.nodes.size > 0 ? Array.from(graph.nodes.values()) : UCI_KEYS}
            fingerPosition={fingerPosition}
            canvasSize={canvasSize}
            hoveredKey={hoveredKey}
            hoverProgress={hoverProgress}
            isRecording={systemState === 'RECORDING'}
          />
        </div>
      </div>

      {/* Panel de mensaje actual - DEBAJO de los círculos */}
      {systemState !== 'IDLE' && (
        <motion.div
          className="fixed top-[38%] left-1/2 -translate-x-1/2 z-30 bg-slate-800/90 backdrop-blur-md rounded-xl p-5 text-white min-w-[300px] max-w-[400px] shadow-2xl border border-slate-700/50"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, type: 'spring' }}
        >
          <h3 className="font-semibold text-base mb-4 flex items-center gap-2 text-slate-200">
            <span className="text-lg">💬</span>
            Mensaje en construcción
          </h3>

          {currentMessage.length === 0 ? (
            <div className="text-slate-500 text-sm text-center py-4">
              Apunta a un círculo para seleccionar...
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {currentMessage.map((word, i) => {
                const keyNode = UCI_KEYS.find(k => k.label === word);
                return (
                  <motion.div
                    key={i}
                    className="px-3 py-1.5 rounded-full text-sm font-medium text-white shadow-md"
                    style={{ backgroundColor: keyNode?.color || '#3b82f6' }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.05, type: 'spring' }}
                  >
                    {word}
                  </motion.div>
                );
              })}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-between items-center text-xs text-slate-500">
            <span>{selectedKeys.length} selección{selectedKeys.length !== 1 ? 'es' : ''}</span>
            <span className="text-slate-600">Puño derecho para finalizar</span>
          </div>
        </motion.div>
      )}

      {/* Panel de instrucciones - esquina inferior izquierda, compacto */}
      <div className="fixed bottom-4 left-4 z-40 bg-slate-800/80 backdrop-blur-sm rounded-lg p-3 text-white text-xs space-y-1.5 max-w-[220px] border border-slate-700/30">
        <div className="font-semibold text-slate-300 mb-2 text-sm">Controles</div>
        <div className="flex items-center gap-2">
          <span className="w-5 text-center">💪</span>
          <span className="text-slate-400">Brazo izq. en L → Iniciar</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 text-center">👆</span>
          <span className="text-slate-400">Dedo índice → Seleccionar</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 text-center">✊</span>
          <span className="text-slate-400">Brazo der. + puño → Fin</span>
        </div>
        <div className="pt-2 border-t border-slate-700/50 text-slate-600">
          {isReady ? '● Sistema listo' : '○ Preparando...'}
        </div>
      </div>

      {/* Panel de métricas completo - aparece al finalizar */}
      {systemState === 'DISPLAYING' && metrics && (
        <MetricsPanel
          metrics={metrics}
          keys={UCI_KEYS}
          onReset={resetSession}
        />
      )}

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
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <div className="w-5 h-5 bg-yellow-400 rounded-full border-3 border-white shadow-lg shadow-yellow-400/50" />
        </motion.div>
      )}

      {/* Barra de progreso de gestos - centrada en la parte superior */}
      <GestureProgressBar
        progress={gestureProgress}
        label={gestureType === 'starting' ? 'Iniciando grabación...' : 'Finalizando...'}
        color={gestureType === 'starting' ? '#10b981' : '#ef4444'}
        visible={gestureType !== 'none'}
      />

      {/* Sutil overlay de gradiente para mejor contraste */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40 pointer-events-none z-10" />
    </div>
  );
}

export default App;
