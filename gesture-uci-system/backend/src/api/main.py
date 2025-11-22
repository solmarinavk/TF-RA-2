"""
API REST principal para DOCommunication Backend

Endpoints:
- POST /api/sessions - Crear nueva sesión
- POST /api/sessions/{session_id}/interactions - Agregar interacción
- GET /api/sessions/{session_id}/metrics - Obtener métricas del grafo
- GET /api/sessions/{session_id} - Obtener sesión completa
- GET /api/sessions - Listar todas las sesiones
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List
from datetime import datetime
import uuid

from ..models.session import Session, InteractionRecord, GraphMetrics
from ..graph.analyzer import InteractionGraphAnalyzer

# Crear aplicación FastAPI
app = FastAPI(
    title="DOCommunication Backend API",
    description="API para análisis de grafos de comunicación gestual UCI",
    version="1.0.0"
)

# Configurar CORS para permitir conexión desde Netlify
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://*.netlify.app",  # Permitir todos los subdominios de Netlify
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Storage en memoria (en producción usar base de datos)
sessions_db: Dict[str, Session] = {}
analyzers_db: Dict[str, InteractionGraphAnalyzer] = {}


@app.get("/")
async def root():
    """Endpoint raíz"""
    return {
        "message": "DOCommunication Backend API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }


@app.post("/api/sessions", status_code=status.HTTP_201_CREATED)
async def create_session() -> Dict:
    """
    Crea una nueva sesión de interacción

    Returns:
        Dict con session_id y start_time
    """
    session_id = str(uuid.uuid4())

    session = Session(
        session_id=session_id,
        start_time=datetime.now(),
        interactions=[],
        selected_message=[]
    )

    sessions_db[session_id] = session
    analyzers_db[session_id] = InteractionGraphAnalyzer()

    return {
        "session_id": session_id,
        "start_time": session.start_time.isoformat()
    }


@app.post("/api/sessions/{session_id}/interactions")
async def add_interaction(
    session_id: str,
    interaction: InteractionRecord
) -> Dict:
    """
    Agrega una interacción a una sesión

    Args:
        session_id: ID de la sesión
        interaction: Datos de la interacción

    Returns:
        Dict con confirmación
    """
    if session_id not in sessions_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sesión {session_id} no encontrada"
        )

    # Agregar a sesión
    session = sessions_db[session_id]
    session.interactions.append(interaction)

    # Agregar al analizador de grafos
    analyzer = analyzers_db[session_id]
    analyzer.add_interaction(interaction)

    return {
        "message": "Interacción agregada exitosamente",
        "num_interactions": len(session.interactions)
    }


@app.get("/api/sessions/{session_id}/metrics")
async def get_session_metrics(session_id: str) -> GraphMetrics:
    """
    Obtiene las métricas del grafo para una sesión

    Args:
        session_id: ID de la sesión

    Returns:
        GraphMetrics con todas las métricas calculadas
    """
    if session_id not in sessions_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sesión {session_id} no encontrada"
        )

    analyzer = analyzers_db[session_id]

    try:
        metrics = analyzer.compute_all_metrics()

        # Guardar métricas en sesión
        sessions_db[session_id].graph_metrics = metrics

        return metrics

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str) -> Session:
    """
    Obtiene una sesión completa

    Args:
        session_id: ID de la sesión

    Returns:
        Session con todos los datos
    """
    if session_id not in sessions_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sesión {session_id} no encontrada"
        )

    return sessions_db[session_id]


@app.get("/api/sessions")
async def list_sessions() -> List[Dict]:
    """
    Lista todas las sesiones

    Returns:
        Lista de sesiones con información resumida
    """
    sessions_list = []

    for session_id, session in sessions_db.items():
        sessions_list.append({
            "session_id": session_id,
            "start_time": session.start_time.isoformat(),
            "end_time": session.end_time.isoformat() if session.end_time else None,
            "num_interactions": len(session.interactions),
            "num_selections": session.num_selections,
            "duration_seconds": session.duration_seconds
        })

    return sessions_list


@app.post("/api/sessions/{session_id}/end")
async def end_session(session_id: str, selected_message: List[str]) -> Dict:
    """
    Finaliza una sesión

    Args:
        session_id: ID de la sesión
        selected_message: Mensaje seleccionado durante la sesión

    Returns:
        Dict con confirmación
    """
    if session_id not in sessions_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sesión {session_id} no encontrada"
        )

    session = sessions_db[session_id]
    session.end_time = datetime.now()
    session.selected_message = selected_message

    return {
        "message": "Sesión finalizada exitosamente",
        "duration_seconds": session.duration_seconds
    }


@app.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str) -> Dict:
    """
    Elimina una sesión

    Args:
        session_id: ID de la sesión

    Returns:
        Dict con confirmación
    """
    if session_id not in sessions_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sesión {session_id} no encontrada"
        )

    del sessions_db[session_id]
    del analyzers_db[session_id]

    return {
        "message": "Sesión eliminada exitosamente"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
