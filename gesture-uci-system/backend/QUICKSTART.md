# 🚀 Inicio Rápido - DOCommunication Backend

Guía de 5 minutos para empezar a usar el backend.

## ⚡ Instalación Rápida

```bash
# 1. Navegar al directorio backend
cd gesture-uci-system/backend

# 2. Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. Instalar dependencias
pip install -r requirements.txt
```

## 🎮 Ejemplos de Uso

### Opción 1: Demo Completo (Recomendado para empezar)

```bash
python main.py demo
```

**Resultado**: Análisis completo con datos simulados + visualización del grafo.

### Opción 2: API REST

```bash
python main.py api
```

Luego abre: http://localhost:8000/docs

**Prueba rápida con curl**:

```bash
# Crear sesión
SESSION_ID=$(curl -s -X POST http://localhost:8000/api/sessions | jq -r '.session_id')

# Agregar interacción
curl -X POST "http://localhost:8000/api/sessions/$SESSION_ID/interactions" \
  -H "Content-Type: application/json" \
  -d '{
    "from_node": "DOLOR",
    "to_node": "AYUDA",
    "timestamp": 1705315800.0,
    "duration": 2.5,
    "session_id": "'$SESSION_ID'"
  }'

# Ver métricas
curl "http://localhost:8000/api/sessions/$SESSION_ID/metrics"
```

### Opción 3: Jupyter Notebook

```bash
jupyter notebook notebooks/main.ipynb
```

**Contenido**: Análisis interactivo paso a paso con visualizaciones.

### Opción 4: Detección con Cámara

```bash
python main.py camera
```

**Controles**:
- ESC: Salir
- ESPACIO: Capturar frame

## 📊 Ver Resultados

Después de ejecutar el demo o la cámara:

```bash
# Ver visualización generada
open visualizations/demo_graph.png  # macOS
xdg-open visualizations/demo_graph.png  # Linux
start visualizations/demo_graph.png  # Windows
```

## 🔧 Generar Datos Simulados

```bash
# Generar 100 interacciones con estructura de comunidades
python data/simulate_data.py --type community --num 100 --output data/my_data.json
```

## 🐳 Usando Docker

```bash
# Construir y ejecutar
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

## 📝 Próximos Pasos

1. **Leer la documentación completa**: `README.md`
2. **Explorar el código**:
   - `src/graph/analyzer.py` - Análisis de grafos
   - `src/vision/detector.py` - Detección de gestos
   - `src/api/main.py` - API REST
3. **Modificar parámetros** en `.env` (copiar de `.env.example`)
4. **Ejecutar tests**: `pytest tests/`

## 🆘 Problemas Comunes

### "ModuleNotFoundError"
```bash
pip install -r requirements.txt
```

### "Camera not found"
Verifica que tu cámara esté conectada y disponible.

### "Port already in use"
```bash
# Cambiar puerto
python -c "from src.api.main import app; import uvicorn; uvicorn.run(app, port=8001)"
```

## 📚 Recursos

- **API Docs**: http://localhost:8000/docs
- **README**: Documentación completa
- **Notebook**: Análisis interactivo en `notebooks/main.ipynb`

---

¿Listo? Empieza con: `python main.py demo` 🎉
