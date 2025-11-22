"""
Tests para InteractionGraphAnalyzer
"""

import pytest
import sys
from pathlib import Path

# Agregar src al path
backend_path = Path(__file__).parent.parent
src_path = backend_path / "src"
sys.path.insert(0, str(src_path))

from src.graph.analyzer import InteractionGraphAnalyzer
from src.utils.data_generator import DataGenerator


class TestInteractionGraphAnalyzer:
    """Test suite para InteractionGraphAnalyzer"""

    @pytest.fixture
    def analyzer_with_data(self):
        """Fixture que retorna analizador con datos"""
        analyzer = InteractionGraphAnalyzer()
        interactions = DataGenerator.generate_community_based()
        analyzer.build_from_interactions(interactions)
        return analyzer

    def test_build_from_interactions(self, analyzer_with_data):
        """Test construcción del grafo"""
        assert analyzer_with_data.graph.number_of_nodes() > 0
        assert analyzer_with_data.graph.number_of_edges() > 0
        assert analyzer_with_data.graph.is_directed()

    def test_compute_all_metrics(self, analyzer_with_data):
        """Test cálculo de métricas"""
        metrics = analyzer_with_data.compute_all_metrics()

        # Verificar métricas topológicas
        assert metrics.num_nodes > 0
        assert metrics.num_edges > 0
        assert 0 <= metrics.density <= 1
        assert metrics.avg_clustering_coefficient >= 0

        # Verificar centralidades
        assert len(metrics.node_metrics) == metrics.num_nodes
        for node_metric in metrics.node_metrics:
            assert 0 <= node_metric.degree_centrality <= 1
            assert node_metric.pagerank > 0

    def test_detect_communities(self, analyzer_with_data):
        """Test detección de comunidades"""
        metrics = analyzer_with_data.compute_all_metrics()

        assert metrics.num_communities > 0
        assert len(metrics.communities) == metrics.num_communities
        assert 0 <= metrics.modularity_score <= 1

        # Verificar que todos los nodos están en alguna comunidad
        all_community_nodes = set()
        for community in metrics.communities:
            all_community_nodes.update(community.nodes)

        assert len(all_community_nodes) == metrics.num_nodes

    def test_robustness_metrics(self, analyzer_with_data):
        """Test métricas de robustez"""
        metrics = analyzer_with_data.compute_all_metrics()

        assert len(metrics.robustness.critical_nodes) > 0
        assert metrics.robustness.vulnerability_score >= 0
        assert 0 <= metrics.robustness.connectivity_loss <= 1

    def test_transition_metrics(self, analyzer_with_data):
        """Test métricas de transiciones"""
        metrics = analyzer_with_data.compute_all_metrics()

        assert metrics.transitions.entropy >= 0
        assert -1 <= metrics.transitions.burstiness <= 1
        assert len(metrics.transitions.transition_matrix) > 0

    def test_diffusion_metrics(self, analyzer_with_data):
        """Test métricas de difusión"""
        metrics = analyzer_with_data.compute_all_metrics()

        assert 0 < metrics.diffusion.activation_threshold < 1
        assert len(metrics.diffusion.influence_maximizers) > 0

        # Verificar que todos tienen spread potential
        for node in analyzer_with_data.graph.nodes():
            assert node in metrics.diffusion.spread_potential
            assert 0 <= metrics.diffusion.spread_potential[node] <= 1

    def test_empty_graph(self):
        """Test con grafo vacío"""
        analyzer = InteractionGraphAnalyzer()

        with pytest.raises(ValueError):
            analyzer.compute_all_metrics()

    def test_single_node(self):
        """Test con un solo nodo"""
        from src.models.session import InteractionRecord

        analyzer = InteractionGraphAnalyzer()
        interaction = InteractionRecord(
            from_node="A",
            to_node="B",
            timestamp=1.0,
            duration=2.0,
            session_id="test"
        )
        analyzer.add_interaction(interaction)

        metrics = analyzer.compute_all_metrics()
        assert metrics.num_nodes == 2
        assert metrics.num_edges == 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
