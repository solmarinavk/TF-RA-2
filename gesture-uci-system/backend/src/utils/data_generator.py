"""
Generador de datos simulados para testing y demostración
"""

import random
import time
from typing import List
from ..models.session import InteractionRecord


class DataGenerator:
    """Genera datos de interacciones simuladas"""

    # Nodos disponibles (palabras comunes en UCI)
    NODES = [
        "DOLOR", "AGUA", "AYUDA", "SI", "NO",
        "GRACIAS", "FAMILIA", "DORMIR", "MEDICAMENTO", "BAÑO"
    ]

    @classmethod
    def generate_random_interactions(
        cls,
        num_interactions: int = 50,
        session_id: str = "test_session"
    ) -> List[InteractionRecord]:
        """
        Genera interacciones aleatorias

        Args:
            num_interactions: Número de interacciones a generar
            session_id: ID de la sesión

        Returns:
            Lista de InteractionRecord
        """
        interactions = []
        timestamp = time.time()

        for i in range(num_interactions):
            # Seleccionar nodos aleatorios
            from_node = random.choice(cls.NODES)
            to_node = random.choice(cls.NODES)

            # Evitar auto-loops
            while to_node == from_node:
                to_node = random.choice(cls.NODES)

            # Duración aleatoria (1-5 segundos)
            duration = random.uniform(1.0, 5.0)

            interaction = InteractionRecord(
                from_node=from_node,
                to_node=to_node,
                timestamp=timestamp + i * 2.0,  # 2 segundos entre interacciones
                duration=duration,
                session_id=session_id
            )

            interactions.append(interaction)

        return interactions

    @classmethod
    def generate_realistic_sequence(
        cls,
        session_id: str = "test_session"
    ) -> List[InteractionRecord]:
        """
        Genera una secuencia realista de interacciones

        Simula un paciente comunicando:
        "DOLOR -> AYUDA -> MEDICAMENTO"

        Returns:
            Lista de InteractionRecord
        """
        sequences = [
            ["DOLOR", "AYUDA", "MEDICAMENTO"],
            ["AGUA", "SI", "GRACIAS"],
            ["BAÑO", "AYUDA", "GRACIAS"],
            ["DOLOR", "MEDICAMENTO", "DORMIR"],
            ["FAMILIA", "SI", "GRACIAS"]
        ]

        interactions = []
        timestamp = time.time()

        for sequence in sequences:
            for i in range(len(sequence) - 1):
                interaction = InteractionRecord(
                    from_node=sequence[i],
                    to_node=sequence[i + 1],
                    timestamp=timestamp,
                    duration=random.uniform(2.0, 4.0),
                    session_id=session_id
                )
                interactions.append(interaction)
                timestamp += random.uniform(1.0, 3.0)

        return interactions

    @classmethod
    def generate_community_based(
        cls,
        session_id: str = "test_session"
    ) -> List[InteractionRecord]:
        """
        Genera interacciones que forman comunidades claras

        Comunidad 1: Necesidades básicas (AGUA, BAÑO, DORMIR)
        Comunidad 2: Asistencia médica (DOLOR, MEDICAMENTO, AYUDA)
        Comunidad 3: Social (FAMILIA, GRACIAS, SI, NO)

        Returns:
            Lista de InteractionRecord
        """
        communities = [
            ["AGUA", "BAÑO", "DORMIR"],
            ["DOLOR", "MEDICAMENTO", "AYUDA"],
            ["FAMILIA", "GRACIAS", "SI", "NO"]
        ]

        interactions = []
        timestamp = time.time()

        # Generar interacciones dentro de cada comunidad
        for community in communities:
            for _ in range(15):  # 15 interacciones por comunidad
                from_node = random.choice(community)
                to_node = random.choice(community)

                while to_node == from_node:
                    to_node = random.choice(community)

                interaction = InteractionRecord(
                    from_node=from_node,
                    to_node=to_node,
                    timestamp=timestamp,
                    duration=random.uniform(1.5, 4.0),
                    session_id=session_id
                )
                interactions.append(interaction)
                timestamp += random.uniform(0.5, 2.0)

        # Agregar algunas interacciones entre comunidades
        for _ in range(10):
            comm1 = random.choice(communities)
            comm2 = random.choice(communities)

            while comm2 == comm1:
                comm2 = random.choice(communities)

            from_node = random.choice(comm1)
            to_node = random.choice(comm2)

            interaction = InteractionRecord(
                from_node=from_node,
                to_node=to_node,
                timestamp=timestamp,
                duration=random.uniform(1.5, 4.0),
                session_id=session_id
            )
            interactions.append(interaction)
            timestamp += random.uniform(0.5, 2.0)

        return interactions
