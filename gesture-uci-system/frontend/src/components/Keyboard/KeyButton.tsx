import React from 'react';
import { motion } from 'framer-motion';
import { KeyNode } from '@/types';
import { PROXIMITY_THRESHOLD } from '@/utils/constants';

interface KeyButtonProps {
  keyNode: KeyNode;
  fingerPosition: { x: number; y: number } | null;
  canvasSize: { width: number; height: number };
  hoverProgress: number;
  isHovered: boolean;
  isRecording: boolean;
}

export const KeyButton: React.FC<KeyButtonProps> = ({
  keyNode,
  fingerPosition,
  canvasSize,
  hoverProgress,
  isHovered,
  isRecording
}) => {
  // Calcular posición en píxeles
  const posX = keyNode.position.x * canvasSize.width;
  const posY = keyNode.position.y * canvasSize.height;

  // Calcular distancia al dedo
  let distance = Infinity;
  let isProximate = false;

  if (fingerPosition) {
    distance = Math.hypot(fingerPosition.x - posX, fingerPosition.y - posY);
    isProximate = distance < PROXIMITY_THRESHOLD;
  }

  return (
    <motion.div
      className="absolute pointer-events-none select-none"
      style={{
        left: `${keyNode.position.x * 100}%`,
        top: `${keyNode.position.y * 100}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: isHovered ? 100 : isProximate ? 50 : 10
      }}
      animate={{
        scale: isHovered ? 1.3 : isProximate ? 1.15 : 1
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* Anillo de proximidad pulsante */}
      {isProximate && !isHovered && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: `3px solid ${keyNode.color}`,
            width: `${keyNode.radius * 2}px`,
            height: `${keyNode.radius * 2}px`,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 0.2, 0.6]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}

      {/* Círculo principal */}
      <div
        className="relative rounded-full flex items-center justify-center font-bold text-white text-center shadow-2xl"
        style={{
          backgroundColor: keyNode.color,
          width: `${keyNode.radius * 2}px`,
          height: `${keyNode.radius * 2}px`,
          border: isHovered ? '4px solid white' : '2px solid rgba(255,255,255,0.3)',
          boxShadow: isHovered
            ? `0 0 30px ${keyNode.color}, 0 0 60px ${keyNode.color}80`
            : isProximate
            ? `0 0 20px ${keyNode.color}60`
            : '0 4px 12px rgba(0,0,0,0.3)',
          fontSize: keyNode.radius > 50 ? '11px' : '9px',
          padding: '8px'
        }}
      >
        {/* Texto de la tecla */}
        <span className="z-10 leading-tight">{keyNode.label}</span>

        {/* Barra de progreso circular */}
        {isHovered && isRecording && hoverProgress > 0 && (
          <>
            <svg
              className="absolute inset-0 -rotate-90"
              style={{
                width: `${keyNode.radius * 2}px`,
                height: `${keyNode.radius * 2}px`
              }}
            >
              <circle
                cx={keyNode.radius}
                cy={keyNode.radius}
                r={keyNode.radius - 6}
                fill="none"
                stroke="white"
                strokeWidth="6"
                strokeDasharray={`${(hoverProgress / 100) * (2 * Math.PI * (keyNode.radius - 6))} ${2 * Math.PI * (keyNode.radius - 6)}`}
                strokeLinecap="round"
                className="transition-all duration-100"
              />
            </svg>

            {/* Porcentaje central */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center text-white font-black bg-black bg-opacity-60 rounded-full"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              style={{
                fontSize: `${keyNode.radius * 0.6}px`
              }}
            >
              {Math.round(hoverProgress)}%
            </motion.div>
          </>
        )}
      </div>

      {/* Badge contador de selecciones */}
      {keyNode.selectionCount > 0 && (
        <motion.div
          className="absolute -top-2 -right-2 bg-white text-black rounded-full shadow-lg flex items-center justify-center font-black text-xs border-2"
          style={{
            width: `${Math.max(24, keyNode.radius * 0.4)}px`,
            height: `${Math.max(24, keyNode.radius * 0.4)}px`,
            borderColor: keyNode.color
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
        >
          {keyNode.selectionCount}
        </motion.div>
      )}

      {/* Efecto de pulso cuando es seleccionado */}
      {isHovered && hoverProgress === 100 && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            backgroundColor: keyNode.color,
            width: `${keyNode.radius * 2}px`,
            height: `${keyNode.radius * 2}px`,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      )}
    </motion.div>
  );
};
