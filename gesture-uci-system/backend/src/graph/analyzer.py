"""
Analizador de grafos de interacciones usando NetworkX

Implementa:
- Métricas estructurales (densidad, diámetro, camino promedio)
- Centralidades (degree, betweenness, closeness, eigenvector, pagerank)
- Robustez (nodos críticos, vulnerabilidad)
- Detección de comunidades (Louvain)
- Análisis de transiciones (matriz, entropía, burstiness)
- Modelos de difusión (Independent Cascade)
"""

import networkx as nx
import numpy as np
from typing import List, Dict, Tuple, Optional
from collections import defaultdict, Counter
import community as community_louvain
from datetime import datetime

from ..models.session import (
    InteractionRecord,
    GraphMetrics,
    NodeMetrics,
    CommunityInfo,
    RobustnessMetrics,
    TransitionMetrics,
    DiffusionMetrics
)


class InteractionGraphAnalyzer:
    """
    Analizador de grafos de interacciones
    """

    def __init__(self):
        """Inicializa el analizador"""
        self.graph: nx.DiGraph = nx.DiGraph()
        self.interactions: List[InteractionRecord] = []

    def add_interaction(self, interaction: InteractionRecord):
        """
        Agrega una interacción al grafo

        Args:
            interaction: Registro de interacción
        """
        self.interactions.append(interaction)

        # Agregar o actualizar arista
        if self.graph.has_edge(interaction.from_node, interaction.to_node):
            # Incrementar peso
            self.graph[interaction.from_node][interaction.to_node]['weight'] += 1
            self.graph[interaction.from_node][interaction.to_node]['durations'].append(
                interaction.duration
            )
        else:
            # Crear nueva arista
            self.graph.add_edge(
                interaction.from_node,
                interaction.to_node,
                weight=1,
                durations=[interaction.duration]
            )

    def build_from_interactions(self, interactions: List[InteractionRecord]):
        """
        Construye el grafo a partir de una lista de interacciones

        Args:
            interactions: Lista de registros de interacción
        """
        self.graph.clear()
        self.interactions = []

        for interaction in interactions:
            self.add_interaction(interaction)

    def compute_all_metrics(self) -> GraphMetrics:
        """
        Calcula todas las métricas del grafo

        Returns:
            GraphMetrics con todas las métricas calculadas
        """
        if len(self.graph.nodes) == 0:
            raise ValueError("El grafo está vacío")

        # Métricas topológicas
        num_nodes = self.graph.number_of_nodes()
        num_edges = self.graph.number_of_edges()
        density = nx.density(self.graph)

        # Diámetro y camino promedio (solo si el grafo es conexo)
        diameter = None
        avg_path_length = None

        if nx.is_weakly_connected(self.graph):
            try:
                # Convertir a no dirigido para diámetro
                undirected = self.graph.to_undirected()
                diameter = nx.diameter(undirected)
                avg_path_length = nx.average_shortest_path_length(undirected)
            except:
                pass

        avg_clustering = nx.average_clustering(self.graph.to_undirected())

        # Métricas por nodo
        node_metrics = self._compute_node_metrics()

        # Comunidades
        communities_data = self._detect_communities()

        # Robustez
        robustness = self._compute_robustness()

        # Transiciones
        transitions = self._compute_transitions()

        # Difusión
        diffusion = self._compute_diffusion()

        return GraphMetrics(
            num_nodes=num_nodes,
            num_edges=num_edges,
            density=density,
            diameter=diameter,
            avg_path_length=avg_path_length,
            avg_clustering_coefficient=avg_clustering,
            node_metrics=node_metrics,
            num_communities=communities_data['num_communities'],
            modularity_score=communities_data['modularity'],
            communities=communities_data['communities'],
            robustness=robustness,
            transitions=transitions,
            diffusion=diffusion
        )

    def _compute_node_metrics(self) -> List[NodeMetrics]:
        """Calcula métricas para cada nodo"""
        nodes = list(self.graph.nodes())

        # Centralidades
        degree_centrality = nx.degree_centrality(self.graph)
        betweenness_centrality = nx.betweenness_centrality(self.graph)
        closeness_centrality = nx.closeness_centrality(self.graph)

        # Eigenvector centrality (puede fallar en grafos dirigidos)
        try:
            eigenvector_centrality = nx.eigenvector_centrality(
                self.graph, max_iter=1000, tol=1e-06
            )
        except:
            eigenvector_centrality = {node: 0.0 for node in nodes}

        # PageRank
        pagerank = nx.pagerank(self.graph)

        # Clustering coefficient
        clustering = nx.clustering(self.graph.to_undirected())

        # Comunidades (para asignar community_id)
        partition = community_louvain.best_partition(self.graph.to_undirected())

        # Crear NodeMetrics para cada nodo
        metrics = []
        for node in nodes:
            metrics.append(NodeMetrics(
                node_id=node,
                degree_centrality=degree_centrality[node],
                betweenness_centrality=betweenness_centrality[node],
                closeness_centrality=closeness_centrality[node],
                eigenvector_centrality=eigenvector_centrality[node],
                pagerank=pagerank[node],
                clustering_coefficient=clustering[node],
                community_id=partition[node]
            ))

        return metrics

    def _detect_communities(self) -> Dict:
        """
        Detecta comunidades usando algoritmo de Louvain

        Returns:
            Dict con num_communities, modularity, communities
        """
        undirected = self.graph.to_undirected()

        # Detectar comunidades
        partition = community_louvain.best_partition(undirected)

        # Calcular modularidad
        modularity = community_louvain.modularity(partition, undirected)

        # Agrupar nodos por comunidad
        communities_dict = defaultdict(list)
        for node, comm_id in partition.items():
            communities_dict[comm_id].append(node)

        # Crear CommunityInfo para cada comunidad
        communities = []
        for comm_id, nodes in communities_dict.items():
            # Contar aristas internas y externas
            internal_edges = 0
            external_edges = 0

            for u, v in undirected.edges():
                if u in nodes and v in nodes:
                    internal_edges += 1
                elif u in nodes or v in nodes:
                    external_edges += 1

            # Calcular contribución a modularidad
            subgraph = undirected.subgraph(nodes)
            m = undirected.number_of_edges()
            e_c = subgraph.number_of_edges() / m if m > 0 else 0

            degrees = [undirected.degree(n) for n in nodes]
            a_c = sum(degrees) / (2 * m) if m > 0 else 0
            mod_contribution = e_c - (a_c ** 2)

            communities.append(CommunityInfo(
                community_id=comm_id,
                nodes=nodes,
                size=len(nodes),
                internal_edges=internal_edges,
                external_edges=external_edges,
                modularity_contribution=mod_contribution
            ))

        return {
            'num_communities': len(communities),
            'modularity': modularity,
            'communities': communities
        }

    def _compute_robustness(self) -> RobustnessMetrics:
        """
        Calcula métricas de robustez del grafo

        Returns:
            RobustnessMetrics
        """
        undirected = self.graph.to_undirected()

        # Calcular betweenness para identificar nodos críticos
        betweenness = nx.betweenness_centrality(self.graph)

        # Top 3 nodos críticos (mayor betweenness)
        critical_nodes = sorted(
            betweenness.items(),
            key=lambda x: x[1],
            reverse=True
        )[:3]
        critical_node_ids = [node for node, _ in critical_nodes]

        # Calcular camino promedio original
        avg_path_original = None
        if nx.is_connected(undirected):
            avg_path_original = nx.average_shortest_path_length(undirected)

        # Simular remoción del nodo más crítico
        avg_path_after = None
        connectivity_loss = 0.0

        if critical_node_ids and nx.is_connected(undirected):
            # Crear copia sin el nodo más crítico
            G_copy = undirected.copy()
            G_copy.remove_node(critical_node_ids[0])

            # Calcular nueva métrica si sigue conexo
            if nx.is_connected(G_copy):
                avg_path_after = nx.average_shortest_path_length(G_copy)
            else:
                # Si se desconecta, calcular para componente más grande
                largest_cc = max(nx.connected_components(G_copy), key=len)
                subgraph = G_copy.subgraph(largest_cc)
                if len(subgraph.nodes) > 1:
                    avg_path_after = nx.average_shortest_path_length(subgraph)

                # Calcular pérdida de conectividad
                connectivity_loss = 1.0 - (len(largest_cc) / len(undirected.nodes))

        # Calcular vulnerability score
        vulnerability = sum([score for _, score in critical_nodes[:3]]) / 3

        return RobustnessMetrics(
            critical_nodes=critical_node_ids,
            vulnerability_score=vulnerability,
            avg_path_length_original=avg_path_original or 0.0,
            avg_path_length_after_removal=avg_path_after or 0.0,
            connectivity_loss=connectivity_loss
        )

    def _compute_transitions(self) -> TransitionMetrics:
        """
        Calcula métricas de transiciones entre nodos

        Returns:
            TransitionMetrics
        """
        # Construir matriz de transiciones
        transition_counts = defaultdict(lambda: defaultdict(int))
        sequence = []

        # Ordenar interacciones por timestamp
        sorted_interactions = sorted(self.interactions, key=lambda x: x.timestamp)

        for interaction in sorted_interactions:
            transition_counts[interaction.from_node][interaction.to_node] += 1
            sequence.append((interaction.from_node, interaction.to_node))

        # Normalizar a probabilidades
        transition_matrix = {}
        for from_node, to_nodes in transition_counts.items():
            total = sum(to_nodes.values())
            transition_matrix[from_node] = {
                to_node: count / total
                for to_node, count in to_nodes.items()
            }

        # Calcular entropía de Shannon
        entropy = 0.0
        for from_node, to_nodes in transition_matrix.items():
            for to_node, prob in to_nodes.items():
                if prob > 0:
                    entropy -= prob * np.log2(prob)

        # Calcular burstiness
        burstiness = self._compute_burstiness(sorted_interactions)

        # Encontrar caminos más comunes (secuencias de 3 nodos)
        most_common_paths = self._find_common_paths(sequence, max_length=3, top_k=5)

        return TransitionMetrics(
            transition_matrix=transition_matrix,
            entropy=entropy,
            burstiness=burstiness,
            most_common_paths=most_common_paths
        )

    def _compute_burstiness(self, sorted_interactions: List[InteractionRecord]) -> float:
        """
        Calcula burstiness de las interacciones

        Burstiness B = (σ - μ) / (σ + μ)
        donde μ = media de intervalos entre eventos
              σ = desviación estándar

        Returns:
            Burstiness score [-1, 1]
        """
        if len(sorted_interactions) < 2:
            return 0.0

        # Calcular intervalos entre interacciones
        intervals = []
        for i in range(1, len(sorted_interactions)):
            interval = sorted_interactions[i].timestamp - sorted_interactions[i-1].timestamp
            intervals.append(interval)

        if not intervals:
            return 0.0

        mean = np.mean(intervals)
        std = np.std(intervals)

        if mean + std == 0:
            return 0.0

        burstiness = (std - mean) / (std + mean)
        return burstiness

    def _find_common_paths(self, sequence: List[Tuple[str, str]],
                          max_length: int = 3,
                          top_k: int = 5) -> List[List[str]]:
        """
        Encuentra los caminos más comunes en la secuencia

        Args:
            sequence: Lista de transiciones (from, to)
            max_length: Longitud máxima del camino
            top_k: Número de caminos a retornar

        Returns:
            Lista de caminos más frecuentes
        """
        if len(sequence) < max_length - 1:
            return []

        # Construir caminos
        paths = []
        for i in range(len(sequence) - max_length + 2):
            path = [sequence[i][0]]
            for j in range(max_length - 1):
                if i + j < len(sequence):
                    path.append(sequence[i + j][1])

            if len(path) == max_length:
                paths.append(tuple(path))

        # Contar frecuencias
        path_counts = Counter(paths)

        # Retornar top K
        most_common = path_counts.most_common(top_k)
        return [list(path) for path, _ in most_common]

    def _compute_diffusion(self) -> DiffusionMetrics:
        """
        Calcula métricas de difusión usando modelo Independent Cascade

        Returns:
            DiffusionMetrics
        """
        # Calcular spread potential para cada nodo
        spread_potential = {}
        cascade_sizes = {}

        # Threshold de activación (probabilidad de que un nodo active a su vecino)
        activation_threshold = 0.3

        nodes = list(self.graph.nodes())

        for seed_node in nodes:
            # Simular diffusion desde este nodo
            activated = self._simulate_independent_cascade(
                seed_node,
                activation_threshold,
                num_simulations=100
            )

            spread_potential[seed_node] = len(activated) / len(nodes)
            cascade_sizes[seed_node] = len(activated)

        # Encontrar influence maximizers (top 3)
        influence_maximizers = sorted(
            spread_potential.items(),
            key=lambda x: x[1],
            reverse=True
        )[:3]
        influence_maximizer_ids = [node for node, _ in influence_maximizers]

        return DiffusionMetrics(
            spread_potential=spread_potential,
            activation_threshold=activation_threshold,
            expected_cascade_size=cascade_sizes,
            influence_maximizers=influence_maximizer_ids
        )

    def _simulate_independent_cascade(self,
                                     seed_node: str,
                                     threshold: float,
                                     num_simulations: int = 100) -> set:
        """
        Simula modelo Independent Cascade

        Args:
            seed_node: Nodo inicial
            threshold: Umbral de activación
            num_simulations: Número de simulaciones

        Returns:
            Set de nodos activados (promedio de simulaciones)
        """
        total_activated = []

        for _ in range(num_simulations):
            activated = {seed_node}
            new_active = {seed_node}

            while new_active:
                next_wave = set()

                for node in new_active:
                    # Intentar activar vecinos
                    for neighbor in self.graph.neighbors(node):
                        if neighbor not in activated:
                            # Probabilidad de activación basada en peso
                            weight = self.graph[node][neighbor].get('weight', 1)
                            activation_prob = min(weight * 0.1, threshold)

                            if np.random.random() < activation_prob:
                                next_wave.add(neighbor)
                                activated.add(neighbor)

                new_active = next_wave

            total_activated.append(activated)

        # Retornar nodos activados en la mayoría de simulaciones
        node_activation_counts = defaultdict(int)
        for activated_set in total_activated:
            for node in activated_set:
                node_activation_counts[node] += 1

        # Nodos activados en al menos 50% de simulaciones
        consensus_activated = {
            node for node, count in node_activation_counts.items()
            if count >= num_simulations * 0.5
        }

        return consensus_activated

    def visualize_graph(self, output_path: str = "graph_visualization.png"):
        """
        Visualiza el grafo

        Args:
            output_path: Ruta donde guardar la imagen
        """
        import matplotlib.pyplot as plt

        plt.figure(figsize=(12, 10))

        # Layout
        pos = nx.spring_layout(self.graph, k=1, iterations=50)

        # Dibujar nodos
        nx.draw_networkx_nodes(
            self.graph,
            pos,
            node_size=1000,
            node_color='lightblue',
            alpha=0.9
        )

        # Dibujar aristas con grosor proporcional al peso
        edges = self.graph.edges()
        weights = [self.graph[u][v]['weight'] for u, v in edges]
        max_weight = max(weights) if weights else 1

        nx.draw_networkx_edges(
            self.graph,
            pos,
            width=[w / max_weight * 5 for w in weights],
            alpha=0.5,
            edge_color='gray',
            arrows=True,
            arrowsize=20
        )

        # Dibujar labels
        nx.draw_networkx_labels(
            self.graph,
            pos,
            font_size=10,
            font_weight='bold'
        )

        plt.title("Grafo de Interacciones - DOCommunication", fontsize=16)
        plt.axis('off')
        plt.tight_layout()
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.close()

        print(f"Grafo visualizado en: {output_path}")
