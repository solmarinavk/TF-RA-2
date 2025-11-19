import React from 'react';
import { KeyNode } from '@/types';
import { KeyButton } from './KeyButton';

interface VirtualKeyboardProps {
  keys: KeyNode[];
  fingerPosition: { x: number; y: number } | null;
  canvasSize: { width: number; height: number };
  hoveredKey: string | null;
  hoverProgress: number;
  isRecording: boolean;
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  keys,
  fingerPosition,
  canvasSize,
  hoveredKey,
  hoverProgress,
  isRecording
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {keys.map(key => (
        <KeyButton
          key={key.id}
          keyNode={key}
          fingerPosition={fingerPosition}
          canvasSize={canvasSize}
          hoverProgress={hoveredKey === key.id ? hoverProgress : 0}
          isHovered={hoveredKey === key.id}
          isRecording={isRecording}
        />
      ))}
    </div>
  );
};
