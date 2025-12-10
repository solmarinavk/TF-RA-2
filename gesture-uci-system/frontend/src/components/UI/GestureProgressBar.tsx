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
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-1.5rem)] max-w-[280px] landscape:max-w-[220px] sm:max-w-none sm:w-auto"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="bg-gray-900 bg-opacity-95 backdrop-blur-lg rounded-lg landscape:rounded-md sm:rounded-2xl p-2.5 landscape:p-2 sm:p-8 shadow-2xl border-2 sm:border-4 border-white sm:min-w-[400px]">
        {/* Título */}
        <div className="text-center mb-1.5 landscape:mb-1 sm:mb-6">
          <div className="text-xl landscape:text-lg sm:text-4xl mb-0.5 landscape:mb-0 sm:mb-3">{progress < 100 ? '⏱️' : '✅'}</div>
          <h3 className="text-white text-xs landscape:text-[11px] sm:text-2xl font-bold leading-tight">{label}</h3>
        </div>

        {/* Barra de progreso */}
        <div className="relative w-full h-4 landscape:h-3 sm:h-8 bg-gray-700 rounded-full overflow-hidden">
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
            <span className="text-white font-bold text-xs landscape:text-[10px] sm:text-lg drop-shadow-lg">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Tiempo restante - solo desktop */}
        <div className="text-center text-gray-300 text-xs sm:text-sm hidden sm:block mt-4">
          {progress < 100 ? (
            <>Tiempo restante: {((2 - (progress / 50)) ).toFixed(1)}s</>
          ) : (
            <>¡Gesto completado!</>
          )}
        </div>

        {/* Anillo animado */}
        <motion.div
          className="absolute -inset-1 landscape:-inset-0.5 sm:-inset-4 rounded-lg landscape:rounded-md sm:rounded-2xl border landscape:border sm:border-4 pointer-events-none"
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
