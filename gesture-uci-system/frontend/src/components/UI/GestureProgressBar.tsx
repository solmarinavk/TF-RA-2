import { motion } from 'framer-motion';

interface GestureProgressBarProps {
  progress: number; // 0-100
  label: string;
  color: string;
  visible: boolean;
}

export function GestureProgressBar({ progress, label, color, visible }: GestureProgressBarProps) {
  if (!visible) return null;

  return (
    <motion.div
      className="fixed top-4 left-1/2 -translate-x-1/2 sm:top-1/2 sm:left-1/2 sm:-translate-y-1/2 z-50 w-[calc(100%-2rem)] sm:w-auto max-w-[320px] sm:max-w-none"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="bg-gray-900 bg-opacity-95 backdrop-blur-lg rounded-xl sm:rounded-2xl p-3 sm:p-8 shadow-2xl border-2 sm:border-4 border-white sm:min-w-[400px]">
        {/* Título */}
        <div className="text-center mb-2 sm:mb-6">
          <div className="text-2xl sm:text-4xl mb-1 sm:mb-3">{progress < 100 ? '⏱️' : '✅'}</div>
          <h3 className="text-white text-sm sm:text-2xl font-bold mb-1 sm:mb-2">{label}</h3>
          <p className="text-gray-400 text-[10px] sm:text-sm hidden sm:block">Mantén la posición...</p>
        </div>

        {/* Barra de progreso */}
        <div className="relative w-full h-5 sm:h-8 bg-gray-700 rounded-full overflow-hidden mb-2 sm:mb-4">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 20px ${color}80`
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1, ease: 'linear' }}
          />

          {/* Texto de porcentaje */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-bold text-sm sm:text-lg drop-shadow-lg">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Tiempo restante - solo desktop */}
        <div className="text-center text-gray-300 text-xs sm:text-sm hidden sm:block">
          {progress < 100 ? (
            <>Tiempo restante: {((2 - (progress / 50)) ).toFixed(1)}s</>
          ) : (
            <>¡Gesto completado!</>
          )}
        </div>

        {/* Anillo animado */}
        <motion.div
          className="absolute -inset-2 sm:-inset-4 rounded-xl sm:rounded-2xl border-2 sm:border-4 pointer-events-none"
          style={{ borderColor: color }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.02, 1]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </div>
    </motion.div>
  );
}
