"""
Script principal para ejecutar DOCommunication Backend

Opciones:
1. python main.py api - Iniciar API REST
2. python main.py demo - Ejecutar demo de análisis de grafos
3. python main.py camera - Ejecutar detección de gestos con cámara
"""

import sys
import argparse
from pathlib import Path

# Agregar src al path
src_path = Path(__file__).parent / "src"
sys.path.insert(0, str(src_path))


def run_api():
    """Inicia el servidor API REST"""
    import uvicorn
    from src.api.main import app

    print("🚀 Iniciando DOCommunication API...")
    print("📖 Documentación: http://localhost:8000/docs")
    print("🔍 Health check: http://localhost:8000/health")

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True
    )


def run_demo():
    """Ejecuta demo de análisis de grafos"""
    from src.graph.analyzer import InteractionGraphAnalyzer
    from src.utils.data_generator import DataGenerator

    print("🎮 Demo: Análisis de Grafos de Interacciones\n")

    # Generar datos simulados
    print("📊 Generando datos simulados...")
    interactions = DataGenerator.generate_community_based()
    print(f"✅ Generadas {len(interactions)} interacciones\n")

    # Crear analizador
    print("🔧 Construyendo grafo de interacciones...")
    analyzer = InteractionGraphAnalyzer()
    analyzer.build_from_interactions(interactions)
    print(f"✅ Grafo construido: {analyzer.graph.number_of_nodes()} nodos, "
          f"{analyzer.graph.number_of_edges()} aristas\n")

    # Calcular métricas
    print("📈 Calculando métricas del grafo...")
    metrics = analyzer.compute_all_metrics()

    print("\n" + "="*60)
    print("MÉTRICAS DEL GRAFO")
    print("="*60)

    print(f"\n📊 Topología:")
    print(f"  • Nodos: {metrics.num_nodes}")
    print(f"  • Aristas: {metrics.num_edges}")
    print(f"  • Densidad: {metrics.density:.3f}")
    print(f"  • Diámetro: {metrics.diameter}")
    print(f"  • Camino promedio: {metrics.avg_path_length:.3f}" if metrics.avg_path_length else "  • Camino promedio: N/A")
    print(f"  • Clustering promedio: {metrics.avg_clustering_coefficient:.3f}")

    print(f"\n🌐 Comunidades:")
    print(f"  • Número de comunidades: {metrics.num_communities}")
    print(f"  • Modularidad: {metrics.modularity_score:.3f}")

    print(f"\n🎯 Top 3 Nodos por PageRank:")
    top_pagerank = sorted(
        metrics.node_metrics,
        key=lambda x: x.pagerank,
        reverse=True
    )[:3]
    for i, node in enumerate(top_pagerank, 1):
        print(f"  {i}. {node.node_id}: {node.pagerank:.3f}")

    print(f"\n🎯 Top 3 Nodos por Betweenness:")
    top_betweenness = sorted(
        metrics.node_metrics,
        key=lambda x: x.betweenness_centrality,
        reverse=True
    )[:3]
    for i, node in enumerate(top_betweenness, 1):
        print(f"  {i}. {node.node_id}: {node.betweenness_centrality:.3f}")

    print(f"\n🛡️ Robustez:")
    print(f"  • Nodos críticos: {', '.join(metrics.robustness.critical_nodes)}")
    print(f"  • Vulnerability score: {metrics.robustness.vulnerability_score:.3f}")
    print(f"  • Pérdida de conectividad: {metrics.robustness.connectivity_loss:.1%}")

    print(f"\n🔄 Transiciones:")
    print(f"  • Entropía: {metrics.transitions.entropy:.3f}")
    print(f"  • Burstiness: {metrics.transitions.burstiness:.3f}")
    print(f"  • Caminos comunes:")
    for i, path in enumerate(metrics.transitions.most_common_paths[:3], 1):
        print(f"    {i}. {' → '.join(path)}")

    print(f"\n💫 Difusión:")
    print(f"  • Threshold: {metrics.diffusion.activation_threshold:.2f}")
    print(f"  • Influence maximizers: {', '.join(metrics.diffusion.influence_maximizers)}")

    # Visualizar grafo
    print(f"\n🎨 Generando visualización del grafo...")
    output_path = Path(__file__).parent / "visualizations" / "demo_graph.png"
    output_path.parent.mkdir(exist_ok=True)
    analyzer.visualize_graph(str(output_path))

    print("\n✅ Demo completado!")


def run_camera():
    """Ejecuta detección de gestos en tiempo real con cámara"""
    import cv2
    from src.vision.detector import GestureDetector

    print("📹 Iniciando detección de gestos con cámara...\n")
    print("Controles:")
    print("  • ESC - Salir")
    print("  • ESPACIO - Capturar frame")
    print()

    # Inicializar cámara
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("❌ Error: No se pudo abrir la cámara")
        return

    # Inicializar detector
    detector = GestureDetector()

    print("✅ Cámara iniciada. Presiona ESC para salir.\n")

    try:
        while True:
            ret, frame = cap.read()

            if not ret:
                print("❌ Error al leer frame")
                break

            # Procesar frame
            annotated_frame, landmark_data, gesture_state = detector.process_frame(frame)

            # Mostrar estado de gestos
            status_text = []

            if gesture_state.left_arm_l:
                status_text.append("✅ Brazo IZQ en L")
            if gesture_state.right_arm_l:
                status_text.append("✅ Brazo DER en L")
            if gesture_state.thumbs_up:
                status_text.append("👍 Thumbs Up")

            # Dibujar texto en frame
            y_offset = 30
            for text in status_text:
                cv2.putText(
                    annotated_frame,
                    text,
                    (10, y_offset),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (0, 255, 0),
                    2
                )
                y_offset += 35

            # Mostrar ángulos
            if gesture_state.left_angle:
                cv2.putText(
                    annotated_frame,
                    f"L Angle: {gesture_state.left_angle:.1f}°",
                    (10, annotated_frame.shape[0] - 60),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (255, 255, 255),
                    2
                )

            if gesture_state.right_angle:
                cv2.putText(
                    annotated_frame,
                    f"R Angle: {gesture_state.right_angle:.1f}°",
                    (10, annotated_frame.shape[0] - 30),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (255, 255, 255),
                    2
                )

            # Mostrar frame
            cv2.imshow('DOCommunication - Gesture Detection', annotated_frame)

            # Manejar teclas
            key = cv2.waitKey(1) & 0xFF

            if key == 27:  # ESC
                break
            elif key == 32:  # ESPACIO
                # Guardar captura
                capture_path = Path(__file__).parent / "visualizations" / "capture.png"
                capture_path.parent.mkdir(exist_ok=True)
                cv2.imwrite(str(capture_path), annotated_frame)
                print(f"📸 Captura guardada: {capture_path}")

    finally:
        cap.release()
        cv2.destroyAllWindows()
        detector.close()
        print("\n✅ Cámara cerrada")


def main():
    """Función principal"""
    parser = argparse.ArgumentParser(
        description="DOCommunication Backend - Sistema de Comunicación Gestual UCI"
    )

    parser.add_argument(
        "mode",
        choices=["api", "demo", "camera"],
        help="Modo de ejecución: api (servidor REST), demo (análisis de grafos), camera (detección en tiempo real)"
    )

    args = parser.parse_args()

    print("="*60)
    print("DOCommunication Backend v1.0")
    print("Sistema de Comunicación Gestual para UCI")
    print("="*60)
    print()

    if args.mode == "api":
        run_api()
    elif args.mode == "demo":
        run_demo()
    elif args.mode == "camera":
        run_camera()


if __name__ == "__main__":
    main()
