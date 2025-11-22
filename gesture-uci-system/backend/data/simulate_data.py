"""
Script para generar y guardar datos simulados en formato JSON

Uso:
    python data/simulate_data.py --output data/interactions.json --num 100
"""

import json
import argparse
from pathlib import Path
import sys

# Agregar src al path
backend_path = Path(__file__).parent.parent
src_path = backend_path / "src"
sys.path.insert(0, str(src_path))

from src.utils.data_generator import DataGenerator


def main():
    parser = argparse.ArgumentParser(
        description="Genera datos simulados de interacciones gestuales"
    )

    parser.add_argument(
        "--output",
        type=str,
        default="data/interactions.json",
        help="Ruta del archivo de salida"
    )

    parser.add_argument(
        "--num",
        type=int,
        default=50,
        help="Número de interacciones a generar"
    )

    parser.add_argument(
        "--type",
        choices=["random", "realistic", "community"],
        default="community",
        help="Tipo de datos a generar"
    )

    args = parser.parse_args()

    print("🎲 Generando datos simulados...")
    print(f"  • Tipo: {args.type}")
    print(f"  • Cantidad: {args.num}")

    # Generar datos según tipo
    if args.type == "random":
        interactions = DataGenerator.generate_random_interactions(
            num_interactions=args.num
        )
    elif args.type == "realistic":
        interactions = DataGenerator.generate_realistic_sequence()
    else:  # community
        interactions = DataGenerator.generate_community_based()

    # Convertir a dict
    data = {
        "session_id": "simulated_session",
        "num_interactions": len(interactions),
        "interactions": [
            {
                "from_node": i.from_node,
                "to_node": i.to_node,
                "timestamp": i.timestamp,
                "duration": i.duration,
                "session_id": i.session_id
            }
            for i in interactions
        ]
    }

    # Guardar
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Datos guardados en: {output_path}")
    print(f"  • Total de interacciones: {len(interactions)}")


if __name__ == "__main__":
    main()
