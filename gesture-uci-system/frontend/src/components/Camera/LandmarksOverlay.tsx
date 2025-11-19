import { useAppStore } from '@/store/useAppStore';

interface LandmarksOverlayProps {
  canvasSize: { width: number; height: number };
}

export function LandmarksOverlay({ canvasSize }: LandmarksOverlayProps) {
  const poseLandmarks = useAppStore(state => state.poseLandmarks);
  const leftHandLandmarks = useAppStore(state => state.leftHandLandmarks);
  const rightHandLandmarks = useAppStore(state => state.rightHandLandmarks);

  const renderLandmark = (
    landmark: { x: number; y: number; z?: number },
    index: number,
    color: string,
    mirrored: boolean = true
  ) => {
    // Invertir X si está espejado
    const x = mirrored ? (1 - landmark.x) * canvasSize.width : landmark.x * canvasSize.width;
    const y = landmark.y * canvasSize.height;

    return (
      <circle
        key={`landmark-${index}`}
        cx={x}
        cy={y}
        r={4}
        fill={color}
        stroke="white"
        strokeWidth={1}
        opacity={0.8}
      />
    );
  };

  const renderConnection = (
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    index: number | string,
    color: string,
    mirrored: boolean = true
  ) => {
    const x1 = mirrored ? (1 - p1.x) * canvasSize.width : p1.x * canvasSize.width;
    const y1 = p1.y * canvasSize.height;
    const x2 = mirrored ? (1 - p2.x) * canvasSize.width : p2.x * canvasSize.width;
    const y2 = p2.y * canvasSize.height;

    return (
      <line
        key={`connection-${index}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={2}
        opacity={0.5}
      />
    );
  };

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={canvasSize.width}
      height={canvasSize.height}
    >
      {/* Pose Landmarks - Puntos clave del brazo */}
      {poseLandmarks && (
        <>
          {/* Brazo izquierdo */}
          {[11, 13, 15].map((idx) => {
            const landmark = poseLandmarks[idx];
            if (landmark && landmark.visibility && landmark.visibility > 0.5) {
              return renderLandmark(landmark, idx, '#3b82f6', true);
            }
            return null;
          })}

          {/* Brazo derecho */}
          {[12, 14, 16].map((idx) => {
            const landmark = poseLandmarks[idx];
            if (landmark && landmark.visibility && landmark.visibility > 0.5) {
              return renderLandmark(landmark, idx, '#10b981', true);
            }
            return null;
          })}

          {/* Conexiones brazo izquierdo */}
          {poseLandmarks[11] && poseLandmarks[13] &&
            renderConnection(poseLandmarks[11], poseLandmarks[13], 0, '#3b82f6', true)}
          {poseLandmarks[13] && poseLandmarks[15] &&
            renderConnection(poseLandmarks[13], poseLandmarks[15], 1, '#3b82f6', true)}

          {/* Conexiones brazo derecho */}
          {poseLandmarks[12] && poseLandmarks[14] &&
            renderConnection(poseLandmarks[12], poseLandmarks[14], 2, '#10b981', true)}
          {poseLandmarks[14] && poseLandmarks[16] &&
            renderConnection(poseLandmarks[14], poseLandmarks[16], 3, '#10b981', true)}
        </>
      )}

      {/* Hand Landmarks - Mano izquierda */}
      {leftHandLandmarks && (
        <>
          {leftHandLandmarks.map((landmark, idx) =>
            renderLandmark(landmark, idx, '#f59e0b', true)
          )}

          {/* Conexiones dedos - mano izquierda */}
          {/* Pulgar */}
          {[0, 1, 2, 3, 4].map((idx, i) => {
            if (i < 4 && leftHandLandmarks[idx] && leftHandLandmarks[idx + 1]) {
              return renderConnection(
                leftHandLandmarks[idx],
                leftHandLandmarks[idx + 1],
                `thumb-${i}`,
                '#f59e0b',
                true
              );
            }
            return null;
          })}

          {/* Índice - destacado */}
          {[0, 5, 6, 7, 8].map((idx, i) => {
            if (i < 4 && leftHandLandmarks[idx === 0 ? 0 : idx] && leftHandLandmarks[idx === 0 ? 5 : idx + 1]) {
              return renderConnection(
                leftHandLandmarks[idx === 0 ? 0 : idx],
                leftHandLandmarks[idx === 0 ? 5 : idx + 1],
                `index-${i}`,
                '#ef4444',
                true
              );
            }
            return null;
          })}
        </>
      )}

      {/* Hand Landmarks - Mano derecha */}
      {rightHandLandmarks && (
        <>
          {rightHandLandmarks.map((landmark, idx) =>
            renderLandmark(landmark, idx + 100, '#a855f7', true)
          )}

          {/* Índice derecho - destacado */}
          {[0, 5, 6, 7, 8].map((idx, i) => {
            if (i < 4 && rightHandLandmarks[idx === 0 ? 0 : idx] && rightHandLandmarks[idx === 0 ? 5 : idx + 1]) {
              return renderConnection(
                rightHandLandmarks[idx === 0 ? 0 : idx],
                rightHandLandmarks[idx === 0 ? 5 : idx + 1],
                `r-index-${i}`,
                '#ef4444',
                true
              );
            }
            return null;
          })}
        </>
      )}
    </svg>
  );
}
