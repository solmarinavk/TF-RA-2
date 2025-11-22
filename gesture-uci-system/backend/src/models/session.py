"""
Modelos de datos para sesiones de interacción y grafos
"""

from datetime import datetime
from typing import List, Dict, Optional
from pydantic import BaseModel, Field


class InteractionRecord(BaseModel):
    """Registro de una interacción individual"""
    from_node: str
    to_node: str
    timestamp: float
    duration: float  # duración de la selección en segundos
    session_id: str


class NodeMetrics(BaseModel):
    """Métricas para un nodo individual"""
    node_id: str
    degree_centrality: float
    betweenness_centrality: float
    closeness_centrality: float
    eigenvector_centrality: float
    pagerank: float
    clustering_coefficient: float
    community_id: Optional[int] = None


class CommunityInfo(BaseModel):
    """Información de una comunidad detectada"""
    community_id: int
    nodes: List[str]
    size: int
    internal_edges: int
    external_edges: int
    modularity_contribution: float


class RobustnessMetrics(BaseModel):
    """Métricas de robustez del grafo"""
    critical_nodes: List[str]
    vulnerability_score: float
    avg_path_length_original: float
    avg_path_length_after_removal: float
    connectivity_loss: float


class TransitionMetrics(BaseModel):
    """Métricas de transiciones entre nodos"""
    transition_matrix: Dict[str, Dict[str, float]]
    entropy: float
    burstiness: float
    most_common_paths: List[List[str]]


class DiffusionMetrics(BaseModel):
    """Métricas de difusión en el grafo"""
    spread_potential: Dict[str, float]
    activation_threshold: float
    expected_cascade_size: Dict[str, float]
    influence_maximizers: List[str]


class GraphMetrics(BaseModel):
    """Métricas completas del grafo de interacciones"""
    # Métricas topológicas generales
    num_nodes: int
    num_edges: int
    density: float
    diameter: Optional[int]
    avg_path_length: Optional[float]
    avg_clustering_coefficient: float

    # Métricas por nodo
    node_metrics: List[NodeMetrics]

    # Detección de comunidades
    num_communities: int
    modularity_score: float
    communities: List[CommunityInfo]

    # Robustez
    robustness: RobustnessMetrics

    # Transiciones
    transitions: TransitionMetrics

    # Difusión
    diffusion: DiffusionMetrics

    # Metadata
    computed_at: datetime = Field(default_factory=datetime.now)


class Session(BaseModel):
    """Sesión completa de interacción"""
    session_id: str
    start_time: datetime
    end_time: Optional[datetime] = None
    interactions: List[InteractionRecord] = []
    selected_message: List[str] = []
    graph_metrics: Optional[GraphMetrics] = None

    @property
    def duration_seconds(self) -> Optional[float]:
        """Duración de la sesión en segundos"""
        if self.end_time:
            return (self.end_time - self.start_time).total_seconds()
        return None

    @property
    def num_selections(self) -> int:
        """Número de selecciones realizadas"""
        return len(self.interactions)
