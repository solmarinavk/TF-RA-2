import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import './styles/globals.css';
import { useAppStore } from './store/useAppStore';
import { UCI_KEYS, SELECTION_DURATION, HOVER_THRESHOLD } from './utils/constants';
import { VirtualKeyboard } from './components/Keyboard/VirtualKeyboard';
import { StateIndicator } from './components/UI/StateIndicator';
import { findClosestNode } from './utils/geometry';

function App() {
  const {
    systemState,
    hoveredKey,
    hoverProgress,
    hoverStartTime,
    currentMessage,
    selectedKeys,
    metrics,
    graph,
    setHover,
    updateHoverProgress,
    addSelection,
    setSystemState,
    resetSession
  } = useAppStore();

  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const containerRef = useRef<HTMLDivElement>(null);

  // Actualizar tamaño de canvas en resize
  useEffect(() => {
    const handleResize = () => {
      setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Tracking de mouse como simulación de dedo índice
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (systemState !== 'RECORDING') return;

      const newPosition = { x: e.clientX, y: e.clientY };
      setMousePosition(newPosition);

      // Buscar tecla más cercana
      const closest = findClosestNode(newPosition, UCI_KEYS, canvasSize, HOVER_THRESHOLD);
      setHover(closest);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [systemState, canvasSize, setHover]);

  // Progreso de hover
  useEffect(() => {
    if (!hoveredKey || !hoverStartTime || systemState !== 'RECORDING') {
      updateHoverProgress(0);
      return;
    }

    let animationFrame: number;

    const updateProgress = () => {
      const elapsed = Date.now() - hoverStartTime;
      const progress = Math.min((elapsed / SELECTION_DURATION) * 100, 100);

      updateHoverProgress(progress);

      if (progress >= 100) {
        // Selección completada!
        addSelection(hoveredKey);
      } else {
        animationFrame = requestAnimationFrame(updateProgress);
      }
    };

    animationFrame = requestAnimationFrame(updateProgress);

    return () => cancelAnimationFrame(animationFrame);
  }, [hoveredKey, hoverStartTime, systemState, updateHoverProgress, addSelection]);

  // Controles de teclado para FSM
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'r':
        case 'R':
          if (systemState === 'IDLE') {
            console.log('🎬 Starting RECORDING (keyboard)');
            setSystemState('RECORDING');
          }
          break;
        case 's':
        case 'S':
          if (systemState === 'RECORDING') {
            console.log('⚙️ Starting PROCESSING (keyboard)');
            setSystemState('PROCESSING');
            setTimeout(() => {
              useAppStore.getState().calculateMetrics();
              useAppStore.getState().completeMessage();
              setSystemState('DISPLAYING');
            }, 500);
          }
          break;
        case 'Escape':
          resetSession();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [systemState, setSystemState, resetSession]);

  return (
    <div ref={containerRef} className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Título y logo */}
      <div className="fixed top-6 left-6 z-40">
        <h1 className="text-2xl font-black text-white drop-shadow-lg">
          UCI Gesture System
        </h1>
        <p className="text-xs text-gray-400 mt-1">Sistema de Comunicación Gestual Hospitalaria</p>
      </div>

      {/* Indicador de estado */}
      <StateIndicator state={systemState} />

      {/* Controles */}
      <div className="fixed bottom-6 left-6 z-40 bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-lg p-4 text-white text-sm space-y-2">
        <div className="font-bold mb-3">🎮 Controles Demo:</div>
        <div><kbd className="bg-gray-700 px-2 py-1 rounded">R</kbd> - Iniciar grabación (IDLE → RECORDING)</div>
        <div><kbd className="bg-gray-700 px-2 py-1 rounded">S</kbd> - Detener y analizar (RECORDING → PROCESSING)</div>
        <div><kbd className="bg-gray-700 px-2 py-1 rounded">ESC</kbd> - Reset a IDLE</div>
        <div className="pt-2 border-t border-gray-700">
          <div className="text-xs text-gray-400">Mueve el mouse sobre las teclas y mantén para seleccionar</div>
        </div>
      </div>

      {/* Panel de mensaje actual */}
      {systemState !== 'IDLE' && (
        <motion.div
          className="fixed top-24 right-6 z-40 bg-gray-800 bg-opacity-95 backdrop-blur-sm rounded-lg p-6 text-white min-w-[300px] max-w-[400px]"
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
        fingerPosition={mousePosition}
        canvasSize={canvasSize}
        hoveredKey={hoveredKey}
        hoverProgress={hoverProgress}
        isRecording={systemState === 'RECORDING'}
      />

      {/* Cursor personalizado en modo RECORDING */}
      {systemState === 'RECORDING' && mousePosition && (
        <motion.div
          className="fixed pointer-events-none z-50"
          style={{
            left: mousePosition.x,
            top: mousePosition.y,
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
