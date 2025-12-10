import React from 'react';
import { motion } from 'framer-motion';
import { SystemState } from '@/types';

interface StateIndicatorProps {
  state: SystemState;
}

const STATE_CONFIG = {
  IDLE: {
    emoji: '🤚',
    text: 'Levanta brazo izquierdo en L para iniciar',
    shortText: 'Brazo L para iniciar',
    color: 'bg-blue-500',
    pulse: true
  },
  RECORDING: {
    emoji: '🔴',
    text: 'GRABANDO - Selecciona con tu dedo índice',
    shortText: 'GRABANDO',
    color: 'bg-red-500',
    pulse: true
  },
  PROCESSING: {
    emoji: '⚙️',
    text: 'Analizando grafo...',
    shortText: 'Procesando...',
    color: 'bg-yellow-500',
    pulse: true
  },
  DISPLAYING: {
    emoji: '✅',
    text: 'Mensaje completo - Brazo izquierdo en L para nuevo mensaje',
    shortText: 'Listo - Brazo L',
    color: 'bg-green-500',
    pulse: false
  }
};

export const StateIndicator: React.FC<StateIndicatorProps> = ({ state }) => {
  const config = STATE_CONFIG[state];

  return (
    <>
      {/* Versión móvil - barra delgada fija arriba (debajo del header ~44px) */}
      <motion.div
        className="fixed top-[44px] left-0 right-0 z-40 md:hidden"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, type: 'spring' }}
      >
        <div
          className={`${config.color} text-white px-2 py-[3px] flex items-center justify-center gap-1 whitespace-nowrap`}
        >
          <span className="text-[10px]">{config.emoji}</span>
          <span className="font-medium text-[10px]">{config.text}</span>
          {config.pulse && (
            <motion.div
              className="w-1 h-1 bg-white rounded-full flex-shrink-0 ml-0.5"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          )}
        </div>
      </motion.div>

      {/* Versión desktop - badge flotante centrado (solo md: y arriba) */}
      <motion.div
        className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 hidden md:block"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        <div
          className={`${config.color} text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-4`}
        >
          <motion.span
            className="text-3xl"
            animate={config.pulse ? {
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            } : {}}
            transition={{
              duration: 1.5,
              repeat: config.pulse ? Infinity : 0
            }}
          >
            {config.emoji}
          </motion.span>
          <span className="font-bold text-lg">
            {config.text}
          </span>
          {config.pulse && (
            <motion.div
              className="w-3 h-3 bg-white rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [1, 0.5, 1]
              }}
              transition={{
                duration: 1,
                repeat: Infinity
              }}
            />
          )}
        </div>
      </motion.div>
    </>
  );
};
