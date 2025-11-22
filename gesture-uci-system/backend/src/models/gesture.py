"""
Modelos de datos para gestos y landmarks
"""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel


class GestureType(str, Enum):
    """Tipos de gestos detectables"""
    LEFT_ARM_L = "left_arm_l"
    RIGHT_ARM_L = "right_arm_l"
    THUMBS_UP = "thumbs_up"
    INDEX_POINT = "index_point"
    FIST = "fist"


class SystemState(str, Enum):
    """Estados del sistema FSM"""
    IDLE = "IDLE"
    RECORDING = "RECORDING"
    PROCESSING = "PROCESSING"
    DISPLAYING = "DISPLAYING"


class Landmark(BaseModel):
    """Punto de landmark individual"""
    x: float
    y: float
    z: float
    visibility: Optional[float] = None


class LandmarkData(BaseModel):
    """Datos de landmarks detectados"""
    pose_landmarks: Optional[List[Landmark]] = None
    left_hand_landmarks: Optional[List[Landmark]] = None
    right_hand_landmarks: Optional[List[Landmark]] = None
    timestamp: float


class GestureState(BaseModel):
    """Estado actual de gestos detectados"""
    left_arm_l: bool = False
    right_arm_l: bool = False
    thumbs_up: bool = False
    left_arm_visible: bool = False
    right_arm_visible: bool = False
    left_angle: Optional[float] = None
    right_angle: Optional[float] = None
    timestamp: float


class GestureEvent(BaseModel):
    """Evento de gesto detectado"""
    gesture_type: GestureType
    timestamp: float
    confidence: float
    metadata: dict = {}
