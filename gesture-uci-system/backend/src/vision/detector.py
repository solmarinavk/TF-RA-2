"""
Detector de gestos usando MediaPipe
"""

import cv2
import mediapipe as mp
import numpy as np
from typing import Optional, Dict, Tuple, List
from ..models.gesture import Landmark, LandmarkData, GestureState
from .geometry import GeometryUtils
import time


class GestureDetector:
    """
    Detector de gestos usando MediaPipe para DOCommunication

    Detecta:
    - Pose (33 landmarks)
    - Manos (21 landmarks por mano)
    - Gestos: L-pose, thumbs up, index pointing
    """

    def __init__(self,
                 min_detection_confidence: float = 0.5,
                 min_tracking_confidence: float = 0.5):
        """
        Inicializa el detector de gestos

        Args:
            min_detection_confidence: Confianza mínima para detección
            min_tracking_confidence: Confianza mínima para tracking
        """
        # Inicializar MediaPipe Pose
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
            model_complexity=1
        )

        # Inicializar MediaPipe Hands
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            max_num_hands=2,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence
        )

        # Utilidades de dibujo
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles

        # Utilidades de geometría
        self.geometry = GeometryUtils()

    def process_frame(self, frame: np.ndarray) -> Tuple[np.ndarray, LandmarkData, GestureState]:
        """
        Procesa un frame y detecta gestos

        Args:
            frame: Frame de imagen (BGR)

        Returns:
            Tupla de (frame_anotado, landmark_data, gesture_state)
        """
        # Convertir BGR a RGB
        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        image.flags.writeable = False

        # Procesar pose
        pose_results = self.pose.process(image)

        # Procesar manos
        hand_results = self.hands.process(image)

        # Preparar imagen para anotaciones
        image.flags.writeable = True
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

        # Extraer landmarks
        timestamp = time.time()

        pose_landmarks = None
        left_hand_landmarks = None
        right_hand_landmarks = None

        # Convertir pose landmarks
        if pose_results.landmarks:
            pose_landmarks = [
                Landmark(x=lm.x, y=lm.y, z=lm.z, visibility=lm.visibility)
                for lm in pose_results.landmarks.landmark
            ]

            # Dibujar pose
            self.mp_drawing.draw_landmarks(
                image,
                pose_results.landmarks,
                self.mp_pose.POSE_CONNECTIONS,
                landmark_drawing_spec=self.mp_drawing_styles.get_default_pose_landmarks_style()
            )

        # Convertir hand landmarks
        if hand_results.multi_hand_landmarks and hand_results.multi_handedness:
            for hand_landmarks, handedness in zip(
                hand_results.multi_hand_landmarks,
                hand_results.multi_handedness
            ):
                # Convertir a lista de Landmark
                landmarks_list = [
                    Landmark(x=lm.x, y=lm.y, z=lm.z)
                    for lm in hand_landmarks.landmark
                ]

                # Determinar si es mano izquierda o derecha
                label = handedness.classification[0].label

                if label == 'Right':  # Right en la imagen = mano derecha real
                    right_hand_landmarks = landmarks_list
                else:
                    left_hand_landmarks = landmarks_list

                # Dibujar mano
                self.mp_drawing.draw_landmarks(
                    image,
                    hand_landmarks,
                    self.mp_hands.HAND_CONNECTIONS,
                    self.mp_drawing_styles.get_default_hand_landmarks_style(),
                    self.mp_drawing_styles.get_default_hand_connections_style()
                )

        # Crear LandmarkData
        landmark_data = LandmarkData(
            pose_landmarks=pose_landmarks,
            left_hand_landmarks=left_hand_landmarks,
            right_hand_landmarks=right_hand_landmarks,
            timestamp=timestamp
        )

        # Detectar gestos
        gesture_state = self._detect_gestures(landmark_data)

        return image, landmark_data, gesture_state

    def _detect_gestures(self, landmark_data: LandmarkData) -> GestureState:
        """
        Detecta gestos a partir de landmarks

        Args:
            landmark_data: Datos de landmarks

        Returns:
            Estado de gestos detectados
        """
        # Detectar L-pose
        l_pose_info = {'left': False, 'right': False, 'left_angle': None,
                       'right_angle': None, 'left_visible': False, 'right_visible': False}

        if landmark_data.pose_landmarks:
            l_pose_info = self.geometry.detect_l_pose(landmark_data.pose_landmarks)

        # Detectar thumbs up en mano derecha
        thumbs_up = False
        if landmark_data.right_hand_landmarks:
            thumbs_up = self.geometry.detect_thumbs_up(landmark_data.right_hand_landmarks)

        # Crear GestureState
        gesture_state = GestureState(
            left_arm_l=l_pose_info['left'],
            right_arm_l=l_pose_info['right'],
            thumbs_up=thumbs_up,
            left_arm_visible=l_pose_info['left_visible'],
            right_arm_visible=l_pose_info['right_visible'],
            left_angle=l_pose_info['left_angle'],
            right_angle=l_pose_info['right_angle'],
            timestamp=landmark_data.timestamp
        )

        return gesture_state

    def get_index_position(self, landmark_data: LandmarkData) -> Optional[Tuple[float, float]]:
        """
        Obtiene la posición del dedo índice

        Args:
            landmark_data: Datos de landmarks

        Returns:
            Tupla (x, y) normalizada [0, 1] o None
        """
        # Priorizar mano derecha
        if landmark_data.right_hand_landmarks:
            return self.geometry.detect_index_pointing(landmark_data.right_hand_landmarks)

        # Fallback a mano izquierda
        if landmark_data.left_hand_landmarks:
            return self.geometry.detect_index_pointing(landmark_data.left_hand_landmarks)

        return None

    def close(self):
        """Libera recursos"""
        self.pose.close()
        self.hands.close()

    def __enter__(self):
        """Context manager entry"""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.close()
