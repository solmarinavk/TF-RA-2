# MediaPipe Landmarks - Referencia Estándar

## ⚠️ IMPORTANTE: NO MODIFICAR ESTOS ÍNDICES

Este sistema utiliza los landmarks estándar de MediaPipe. Cualquier cambio romperá la compatibilidad.

## Pose Landmarks (33 puntos)

### Cara (0-10)

| Índice | Nombre | Descripción |
|--------|--------|-------------|
| 0 | NOSE | Punta de la nariz |
| 1 | LEFT_EYE_INNER | Esquina interna ojo izquierdo |
| 2 | LEFT_EYE | Centro ojo izquierdo |
| 3 | LEFT_EYE_OUTER | Esquina externa ojo izquierdo |
| 4 | RIGHT_EYE_INNER | Esquina interna ojo derecho |
| 5 | RIGHT_EYE | Centro ojo derecho |
| 6 | RIGHT_EYE_OUTER | Esquina externa ojo derecho |
| 7 | LEFT_EAR | Oreja izquierda |
| 8 | RIGHT_EAR | Oreja derecha |
| 9 | MOUTH_LEFT | Esquina izquierda boca |
| 10 | MOUTH_RIGHT | Esquina derecha boca |

### Extremidades Superiores (11-22)

| Índice | Nombre | Descripción |
|--------|--------|-------------|
| 11 | LEFT_SHOULDER | Hombro izquierdo |
| 12 | RIGHT_SHOULDER | Hombro derecho |
| 13 | LEFT_ELBOW | Codo izquierdo |
| 14 | RIGHT_ELBOW | Codo derecho |
| 15 | LEFT_WRIST | Muñeca izquierda |
| 16 | RIGHT_WRIST | Muñeca derecha |
| 17 | LEFT_PINKY | Meñique izquierdo |
| 18 | RIGHT_PINKY | Meñique derecho |
| 19 | LEFT_INDEX | Índice izquierdo |
| 20 | RIGHT_INDEX | Índice derecho |
| 21 | LEFT_THUMB | Pulgar izquierdo |
| 22 | RIGHT_THUMB | Pulgar derecho |

### Extremidades Inferiores (23-32)

| Índice | Nombre | Descripción |
|--------|--------|-------------|
| 23 | LEFT_HIP | Cadera izquierda |
| 24 | RIGHT_HIP | Cadera derecha |
| 25 | LEFT_KNEE | Rodilla izquierda |
| 26 | RIGHT_KNEE | Rodilla derecha |
| 27 | LEFT_ANKLE | Tobillo izquierdo |
| 28 | RIGHT_ANKLE | Tobillo derecho |
| 29 | LEFT_HEEL | Talón izquierdo |
| 30 | RIGHT_HEEL | Talón derecho |
| 31 | LEFT_FOOT_INDEX | Punta pie izquierdo |
| 32 | RIGHT_FOOT_INDEX | Punta pie derecho |

## Hand Landmarks (21 puntos por mano)

### Estructura

| Índice | Nombre | Descripción |
|--------|--------|-------------|
| 0 | WRIST | Muñeca (base) |
| 1 | THUMB_CMC | Pulgar - Carpometacarpiana |
| 2 | THUMB_MCP | Pulgar - Metacarpofalángica |
| 3 | THUMB_IP | Pulgar - Interfalángica |
| 4 | THUMB_TIP | Pulgar - Punta |
| 5 | INDEX_FINGER_MCP | Índice - Metacarpofalángica |
| 6 | INDEX_FINGER_PIP | Índice - Interfalángica proximal |
| 7 | INDEX_FINGER_DIP | Índice - Interfalángica distal |
| 8 | INDEX_FINGER_TIP | Índice - Punta |
| 9 | MIDDLE_FINGER_MCP | Medio - Metacarpofalángica |
| 10 | MIDDLE_FINGER_PIP | Medio - Interfalángica proximal |
| 11 | MIDDLE_FINGER_DIP | Medio - Interfalángica distal |
| 12 | MIDDLE_FINGER_TIP | Medio - Punta |
| 13 | RING_FINGER_MCP | Anular - Metacarpofalángica |
| 14 | RING_FINGER_PIP | Anular - Interfalángica proximal |
| 15 | RING_FINGER_DIP | Anular - Interfalángica distal |
| 16 | RING_FINGER_TIP | Anular - Punta |
| 17 | PINKY_MCP | Meñique - Metacarpofalángica |
| 18 | PINKY_PIP | Meñique - Interfalángica proximal |
| 19 | PINKY_DIP | Meñique - Interfalángica distal |
| 20 | PINKY_TIP | Meñique - Punta |

## Detección Postura en L

### Brazo Izquierdo
```
Hombro: landmark 11
Codo:   landmark 13
Muñeca: landmark 15

Ángulo = angle(11, 13, 15) ≈ 90° (±15°)
```

### Brazo Derecho
```
Hombro: landmark 12
Codo:   landmark 14
Muñeca: landmark 16

Ángulo = angle(12, 14, 16) ≈ 90° (±15°)
```

### Criterios de Validación
- Ángulo debe estar entre 75° y 105°
- Postura debe mantenerse por 1.5 segundos
- Visibility de landmarks > 0.5

## Para Selección de Teclas

### Punta del Índice
```
Mano izquierda:  landmark 8
Mano derecha:    landmark 8
```

### Criterios de Selección
- Punta de índice dentro del radio de tecla (60px)
- Hover sostenido por 3 segundos
- Tracking confidence > 0.7

## Coordenadas

Todas las coordenadas son normalizadas:
- **x**: 0.0 (izquierda) a 1.0 (derecha)
- **y**: 0.0 (arriba) a 1.0 (abajo)
- **z**: Profundidad relativa (negativo = hacia cámara)

## Referencias

- [MediaPipe Pose](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker)
- [MediaPipe Hands](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker)
- [MediaPipe Tasks Vision API](https://developers.google.com/mediapipe/api/solutions/js/tasks-vision)

## Notas de Implementación

1. **Visibility**: Pose landmarks incluyen un campo `visibility` (0.0-1.0)
2. **Confidence**: Usar thresholds apropiados para filtrar detecciones ruidosas
3. **Normalización**: Convertir coordenadas normalizadas a píxeles usando dimensiones de canvas
4. **Handedness**: Hand landmarks incluyen información de lateralidad (Left/Right)
