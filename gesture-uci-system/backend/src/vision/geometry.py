"""
Utilidades de geometría para detección de gestos
"""

import numpy as np
from typing import List, Tuple, Optional, Dict
from ..models.gesture import Landmark


class GeometryUtils:
    """Utilidades para cálculos geométricos en detección de gestos"""

    # Tolerancia para ángulo de L-pose (45° de tolerancia = rango 45°-135°)
    L_POSE_ANGLE_TOLERANCE = 45.0

    # Índices de landmarks de MediaPipe Pose (33 puntos)
    POSE_LANDMARKS = {
        'LEFT_SHOULDER': 11,
        'LEFT_ELBOW': 13,
        'LEFT_WRIST': 15,
        'RIGHT_SHOULDER': 12,
        'RIGHT_ELBOW': 14,
        'RIGHT_WRIST': 16,
    }

    # Índices de landmarks de MediaPipe Hand (21 puntos)
    HAND_LANDMARKS = {
        'WRIST': 0,
        'THUMB_TIP': 4,
        'THUMB_IP': 3,
        'INDEX_TIP': 8,
        'INDEX_MCP': 5,
        'MIDDLE_TIP': 12,
        'RING_TIP': 16,
        'PINKY_TIP': 20,
    }

    @staticmethod
    def distance_3d(p1: Landmark, p2: Landmark) -> float:
        """Calcula distancia euclidiana 3D entre dos landmarks"""
        return np.sqrt(
            (p1.x - p2.x) ** 2 +
            (p1.y - p2.y) ** 2 +
            (p1.z - p2.z) ** 2
        )

    @staticmethod
    def angle_between_vectors(v1: np.ndarray, v2: np.ndarray) -> float:
        """
        Calcula el ángulo entre dos vectores en grados

        Args:
            v1: Vector 1 como numpy array
            v2: Vector 2 como numpy array

        Returns:
            Ángulo en grados [0, 180]
        """
        # Normalizar vectores
        v1_norm = v1 / (np.linalg.norm(v1) + 1e-8)
        v2_norm = v2 / (np.linalg.norm(v2) + 1e-8)

        # Calcular producto punto
        dot_product = np.clip(np.dot(v1_norm, v2_norm), -1.0, 1.0)

        # Calcular ángulo en radianes y convertir a grados
        angle_rad = np.arccos(dot_product)
        angle_deg = np.degrees(angle_rad)

        return angle_deg

    @classmethod
    def detect_l_pose(cls, pose_landmarks: List[Landmark]) -> Dict:
        """
        Detecta si los brazos están en posición de L

        Args:
            pose_landmarks: Lista de 33 landmarks de pose

        Returns:
            Dict con información de detección:
            {
                'left': bool,
                'right': bool,
                'left_angle': float | None,
                'right_angle': float | None,
                'left_visible': bool,
                'right_visible': bool
            }
        """
        if not pose_landmarks or len(pose_landmarks) < 17:
            return {
                'left': False,
                'right': False,
                'left_angle': None,
                'right_angle': None,
                'left_visible': False,
                'right_visible': False
            }

        # Extraer landmarks necesarios
        left_shoulder = pose_landmarks[cls.POSE_LANDMARKS['LEFT_SHOULDER']]
        left_elbow = pose_landmarks[cls.POSE_LANDMARKS['LEFT_ELBOW']]
        left_wrist = pose_landmarks[cls.POSE_LANDMARKS['LEFT_WRIST']]

        right_shoulder = pose_landmarks[cls.POSE_LANDMARKS['RIGHT_SHOULDER']]
        right_elbow = pose_landmarks[cls.POSE_LANDMARKS['RIGHT_ELBOW']]
        right_wrist = pose_landmarks[cls.POSE_LANDMARKS['RIGHT_WRIST']]

        # Verificar visibilidad en frame (5% de margen)
        margin = 0.05

        def is_visible_in_frame(shoulder, elbow, wrist):
            points = [shoulder, elbow, wrist]
            for p in points:
                if (p.x < margin or p.x > 1 - margin or
                    p.y < margin or p.y > 1 - margin):
                    return False
            return True

        left_visible = is_visible_in_frame(left_shoulder, left_elbow, left_wrist)
        right_visible = is_visible_in_frame(right_shoulder, right_elbow, right_wrist)

        # Calcular ángulos
        left_angle = None
        right_angle = None

        # Brazo izquierdo
        v1_left = np.array([
            left_shoulder.x - left_elbow.x,
            left_shoulder.y - left_elbow.y,
            left_shoulder.z - left_elbow.z
        ])
        v2_left = np.array([
            left_wrist.x - left_elbow.x,
            left_wrist.y - left_elbow.y,
            left_wrist.z - left_elbow.z
        ])

        if np.linalg.norm(v1_left) > 0 and np.linalg.norm(v2_left) > 0:
            left_angle = cls.angle_between_vectors(v1_left, v2_left)

        # Brazo derecho
        v1_right = np.array([
            right_shoulder.x - right_elbow.x,
            right_shoulder.y - right_elbow.y,
            right_shoulder.z - right_elbow.z
        ])
        v2_right = np.array([
            right_wrist.x - right_elbow.x,
            right_wrist.y - right_elbow.y,
            right_wrist.z - right_elbow.z
        ])

        if np.linalg.norm(v1_right) > 0 and np.linalg.norm(v2_right) > 0:
            right_angle = cls.angle_between_vectors(v1_right, v2_right)

        # Determinar si está en L (ángulo cercano a 90° con tolerancia de 45°)
        left_in_l = (left_angle is not None and
                     abs(left_angle - 90) < cls.L_POSE_ANGLE_TOLERANCE and
                     left_visible)

        right_in_l = (right_angle is not None and
                      abs(right_angle - 90) < cls.L_POSE_ANGLE_TOLERANCE)

        return {
            'left': left_in_l,
            'right': right_in_l,
            'left_angle': left_angle,
            'right_angle': right_angle,
            'left_visible': left_visible,
            'right_visible': right_visible
        }

    @classmethod
    def detect_thumbs_up(cls, hand_landmarks: Optional[List[Landmark]]) -> bool:
        """
        Detecta gesto de pulgar arriba (👍)

        Args:
            hand_landmarks: Lista de 21 landmarks de mano

        Returns:
            True si se detecta thumbs up
        """
        if not hand_landmarks or len(hand_landmarks) < 21:
            return False

        thumb_tip = hand_landmarks[cls.HAND_LANDMARKS['THUMB_TIP']]
        thumb_ip = hand_landmarks[cls.HAND_LANDMARKS['THUMB_IP']]
        index_tip = hand_landmarks[cls.HAND_LANDMARKS['INDEX_TIP']]
        index_mcp = hand_landmarks[cls.HAND_LANDMARKS['INDEX_MCP']]
        middle_tip = hand_landmarks[cls.HAND_LANDMARKS['MIDDLE_TIP']]
        ring_tip = hand_landmarks[cls.HAND_LANDMARKS['RING_TIP']]
        pinky_tip = hand_landmarks[cls.HAND_LANDMARKS['PINKY_TIP']]

        # 1. Pulgar extendido hacia arriba
        thumb_extended = thumb_tip.y < thumb_ip.y

        # 2. Otros dedos doblados (comparar distancias)
        thumb_dist = cls.distance_3d(thumb_tip, index_mcp)

        index_folded = cls.distance_3d(index_tip, index_mcp) < thumb_dist * 0.8
        middle_folded = cls.distance_3d(middle_tip, index_mcp) < thumb_dist * 0.8
        ring_folded = cls.distance_3d(ring_tip, index_mcp) < thumb_dist * 0.8
        pinky_folded = cls.distance_3d(pinky_tip, index_mcp) < thumb_dist * 0.8

        # Al menos 2 de 4 dedos doblados
        folded_count = sum([index_folded, middle_folded, ring_folded, pinky_folded])

        return thumb_extended and folded_count >= 2

    @classmethod
    def detect_index_pointing(cls, hand_landmarks: Optional[List[Landmark]]) -> Optional[Tuple[float, float]]:
        """
        Detecta dedo índice apuntando y retorna su posición

        Args:
            hand_landmarks: Lista de 21 landmarks de mano

        Returns:
            Tupla (x, y) de la punta del índice o None
        """
        if not hand_landmarks or len(hand_landmarks) < 21:
            return None

        index_tip = hand_landmarks[cls.HAND_LANDMARKS['INDEX_TIP']]

        # Retornar posición normalizada [0, 1]
        return (index_tip.x, index_tip.y)
