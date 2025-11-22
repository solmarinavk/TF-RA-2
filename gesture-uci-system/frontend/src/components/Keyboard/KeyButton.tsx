import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { KeyNode } from '@/types';

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
  hoverProgress,
  isHovered,
  isRecording
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isProximate, setIsProximate] = useState(false);

  // Calcular proximidad basándose en la posición real del elemento en pantalla
  useEffect(() => {
    if (!fingerPosition || !buttonRef.current) {
      setIsProximate(false);
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distance = Math.hypot(fingerPosition.x - centerX, fingerPosition.y - centerY);
    const proximityThreshold = keyNode.radius * 1.5;

    setIsProximate(distance < proximityThreshold);
  }, [fingerPosition, keyNode.radius]);

  // Tamaño responsive basado en viewport width
  const getResponsiveSize = () => {
    const vw = window.innerWidth;
    if (vw < 640) return 70;  // móvil
    if (vw < 768) return 80;  // tablet pequeño
    if (vw < 1024) return 90; // tablet
    if (vw < 1280) return 100; // laptop pequeño (14")
    return 110; // laptop grande (16"+)
  };

  const size = getResponsiveSize();

  return (
    <motion.div
      ref={buttonRef}
      data-key-id={keyNode.id}
      className="relative pointer-events-none select-none flex-shrink-0"
      style={{
        width: size,
        height: size,
        zIndex: isHovered ? 100 : isProximate ? 50 : 10
      }}
      animate={{
        scale: isHovered ? 1.2 : isProximate ? 1.08 : 1
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* Anillo de proximidad pulsante */}
      {isProximate && !isHovered && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: `3px solid ${keyNode.color}`,
          }}
          animate={{
            scale: [1, 1.15, 1],
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
        className="relative w-full h-full rounded-full flex items-center justify-center font-bold text-white text-center shadow-xl backdrop-blur-sm"
        style={{
          backgroundColor: isHovered ? keyNode.color : `${keyNode.color}DD`,
          border: isHovered ? '3px solid white' : '2px solid rgba(255,255,255,0.3)',
          boxShadow: isHovered
            ? `0 0 25px ${keyNode.color}, 0 0 50px ${keyNode.color}60`
            : isProximate
            ? `0 0 15px ${keyNode.color}40`
            : '0 4px 15px rgba(0,0,0,0.4)',
          fontSize: size > 100 ? '12px' : '10px',
          padding: '8px',
          lineHeight: 1.2
        }}
      >
        {/* Texto de la tecla */}
        <span className="z-10 leading-tight px-1">{keyNode.label}</span>

        {/* Barra de progreso circular */}
        {isHovered && isRecording && hoverProgress > 0 && (
          <>
            <svg
              className="absolute inset-0 -rotate-90"
              style={{ width: '100%', height: '100%' }}
            >
              <circle
                cx="50%"
                cy="50%"
                r={(size / 2) - 5}
                fill="none"
                stroke="white"
                strokeWidth="5"
                strokeDasharray={`${(hoverProgress / 100) * (2 * Math.PI * ((size / 2) - 5))} ${2 * Math.PI * ((size / 2) - 5)}`}
                strokeLinecap="round"
                className="transition-all duration-100"
              />
            </svg>

            {/* Porcentaje central */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center text-white font-black bg-black/70 rounded-full"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.15 }}
              style={{ fontSize: `${size * 0.25}px` }}
            >
              {Math.round(hoverProgress)}%
            </motion.div>
          </>
        )}
      </div>

      {/* Badge contador de selecciones */}
      {keyNode.selectionCount > 0 && (
        <motion.div
          className="absolute -top-1 -right-1 bg-white text-slate-900 rounded-full shadow-lg flex items-center justify-center font-black text-xs border-2"
          style={{
            width: 22,
            height: 22,
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
          style={{ backgroundColor: keyNode.color }}
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      )}
    </motion.div>
  );
};
