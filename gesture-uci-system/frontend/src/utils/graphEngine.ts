import { KeyNode, GraphEdge, GraphMetrics } from '@/types';

/**
 * Motor de grafos para análisis de interacciones
 */
export class InteractionGraph {
  nodes: Map<string, KeyNode>;
  adjacency: Map<string, Map<string, number>>; // lista de adyacencia con pesos
  edges: GraphEdge[];

  constructor(initialNodes: KeyNode[]) {
    this.nodes = new Map(initialNodes.map(node => [node.id, { ...node }]));
    this.adjacency = new Map();
    this.edges = [];

    // Inicializar adjacency para cada nodo
    for (const node of initialNodes) {
      this.adjacency.set(node.id, new Map());
    }
  }

  /**
   * Añade una arista dirigida del nodo from al nodo to
   */
  addEdge(from: string, to: string): void {
    if (!this.nodes.has(from) || !this.nodes.has(to)) {
      console.warn(`Attempting to add edge between non-existent nodes: ${from} -> ${to}`);
      return;
    }

    // Incrementar peso si ya existe la arista
    const fromAdj = this.adjacency.get(from)!;
    const currentWeight = fromAdj.get(to) || 0;
    fromAdj.set(to, currentWeight + 1);

    // Actualizar o añadir edge
    const existingEdge = this.edges.find(e => e.from === from && e.to === to);
    if (existingEdge) {
      existingEdge.weight++;
      existingEdge.timestamp = Date.now();
    } else {
      this.edges.push({
        from,
        to,
        weight: 1,
        timestamp: Date.now()
      });
    }

    // Incrementar selection count del nodo destino
    const toNode = this.nodes.get(to)!;
    toNode.selectionCount++;
    toNode.lastSelected = Date.now();
  }

  /**
   * Obtiene el grado de entrada de un nodo
   */
  getInDegree(nodeId: string): number {
    let inDegree = 0;
    for (const [_, neighbors] of this.adjacency) {
      if (neighbors.has(nodeId)) {
        inDegree += neighbors.get(nodeId)!;
      }
    }
    return inDegree;
  }

  /**
   * Obtiene el grado de salida de un nodo
   */
  getOutDegree(nodeId: string): number {
    const neighbors = this.adjacency.get(nodeId);
    if (!neighbors) return 0;

    let outDegree = 0;
    for (const weight of neighbors.values()) {
      outDegree += weight;
    }
    return outDegree;
  }

  /**
   * Calcula la centralidad de grado (normalizada)
   */
  calculateDegreeCentrality(): Record<string, number> {
    const n = this.nodes.size;
    if (n <= 1) return {};

    const centrality: Record<string, number> = {};

    for (const [nodeId] of this.nodes) {
      const inDegree = this.getInDegree(nodeId);
      const outDegree = this.getOutDegree(nodeId);
      const totalDegree = inDegree + outDegree;

      // Normalizar por el máximo posible: 2 * (n - 1) para grafo dirigido
      centrality[nodeId] = totalDegree / (2 * (n - 1));
    }

    return centrality;
  }

  /**
   * Calcula la centralidad de intermediación (Betweenness Centrality)
   * Usa algoritmo de Brandes simplificado
   */
  calculateBetweennessCentrality(): Record<string, number> {
    const centrality: Record<string, number> = {};

    // Inicializar centrality
    for (const [nodeId] of this.nodes) {
      centrality[nodeId] = 0;
    }

    // Para cada nodo como fuente
    for (const [source] of this.nodes) {
      const stack: string[] = [];
      const predecessors: Map<string, string[]> = new Map();
      const sigma: Map<string, number> = new Map(); // número de shortest paths
      const distance: Map<string, number> = new Map();
      const delta: Map<string, number> = new Map();

      // Inicializar
      for (const [nodeId] of this.nodes) {
        predecessors.set(nodeId, []);
        sigma.set(nodeId, 0);
        distance.set(nodeId, -1);
        delta.set(nodeId, 0);
      }

      sigma.set(source, 1);
      distance.set(source, 0);

      const queue: string[] = [source];

      // BFS
      while (queue.length > 0) {
        const v = queue.shift()!;
        stack.push(v);

        const neighbors = this.adjacency.get(v)!;
        for (const [w] of neighbors) {
          // Primera vez que visitamos w?
          if (distance.get(w)! < 0) {
            queue.push(w);
            distance.set(w, distance.get(v)! + 1);
          }

          // Shortest path a w vía v?
          if (distance.get(w)! === distance.get(v)! + 1) {
            sigma.set(w, sigma.get(w)! + sigma.get(v)!);
            predecessors.get(w)!.push(v);
          }
        }
      }

      // Acumular dependency
      while (stack.length > 0) {
        const w = stack.pop()!;
        for (const v of predecessors.get(w)!) {
          const factor = (sigma.get(v)! / sigma.get(w)!) * (1 + delta.get(w)!);
          delta.set(v, delta.get(v)! + factor);
        }

        if (w !== source) {
          centrality[w] += delta.get(w)!;
        }
      }
    }

    // Normalizar para grafo dirigido
    const n = this.nodes.size;
    const normFactor = n > 2 ? 1 / ((n - 1) * (n - 2)) : 1;

    for (const nodeId in centrality) {
      centrality[nodeId] *= normFactor;
    }

    return centrality;
  }

  /**
   * Calcula la densidad del grafo
   * Densidad = m / (n * (n - 1)) para grafo dirigido
   */
  calculateDensity(): number {
    const n = this.nodes.size;
    if (n <= 1) return 0;

    const m = this.edges.length;
    return m / (n * (n - 1));
  }

  /**
   * Calcula el diámetro del grafo (distancia máxima entre nodos conectados)
   * Retorna null si el grafo no es conexo
   */
  calculateDiameter(): number | null {
    const n = this.nodes.size;
    if (n === 0) return null;

    let maxDistance = 0;
    let hasPath = false;

    for (const [source] of this.nodes) {
      const distances = this.bfs(source);

      for (const [target, distance] of distances) {
        if (source !== target && distance >= 0) {
          hasPath = true;
          maxDistance = Math.max(maxDistance, distance);
        }
      }
    }

    return hasPath ? maxDistance : null;
  }

  /**
   * BFS desde un nodo fuente para calcular distancias
   */
  private bfs(source: string): Map<string, number> {
    const distances = new Map<string, number>();

    // Inicializar todas las distancias a -1 (no alcanzable)
    for (const [nodeId] of this.nodes) {
      distances.set(nodeId, -1);
    }

    distances.set(source, 0);
    const queue: string[] = [source];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentDistance = distances.get(current)!;

      const neighbors = this.adjacency.get(current)!;
      for (const [neighbor] of neighbors) {
        if (distances.get(neighbor)! < 0) {
          distances.set(neighbor, currentDistance + 1);
          queue.push(neighbor);
        }
      }
    }

    return distances;
  }

  /**
   * Detecta comunidades usando algoritmo de Louvain simplificado
   * Retorna un mapa de comunidad ID a lista de nodos
   */
  detectCommunities(): Record<number, string[]> {
    // Implementación simplificada: clustering basado en modularidad
    // Para un grafo pequeño (10 nodos), podemos usar greedy modularity

    const communities: Map<string, number> = new Map();
    let communityId = 0;

    // Inicialmente cada nodo es su propia comunidad
    for (const [nodeId] of this.nodes) {
      communities.set(nodeId, communityId++);
    }

    let improved = true;
    let iterations = 0;
    const maxIterations = 10;

    // Iterar hasta que no haya mejoras o máx iteraciones
    while (improved && iterations < maxIterations) {
      improved = false;
      iterations++;

      for (const [nodeId] of this.nodes) {
        const currentCommunity = communities.get(nodeId)!;
        let bestCommunity = currentCommunity;
        let bestGain = 0;

        // Probar mover el nodo a la comunidad de cada vecino
        const neighbors = this.adjacency.get(nodeId)!;
        const neighborCommunities = new Set<number>();

        for (const [neighborId] of neighbors) {
          neighborCommunities.add(communities.get(neighborId)!);
        }

        for (const targetCommunity of neighborCommunities) {
          if (targetCommunity === currentCommunity) continue;

          const gain = this.calculateModularityGain(nodeId, currentCommunity, targetCommunity, communities);

          if (gain > bestGain) {
            bestGain = gain;
            bestCommunity = targetCommunity;
          }
        }

        if (bestCommunity !== currentCommunity) {
          communities.set(nodeId, bestCommunity);
          improved = true;
        }
      }
    }

    // Convertir a formato de salida
    const result: Record<number, string[]> = {};
    for (const [nodeId, commId] of communities) {
      if (!result[commId]) {
        result[commId] = [];
      }
      result[commId].push(nodeId);
    }

    return result;
  }

  /**
   * Calcula la ganancia de modularidad al mover un nodo a otra comunidad
   */
  private calculateModularityGain(
    nodeId: string,
    fromCommunity: number,
    toCommunity: number,
    communities: Map<string, number>
  ): number {
    let gain = 0;

    // Contar enlaces del nodo a cada comunidad
    const neighbors = this.adjacency.get(nodeId)!;

    for (const [neighborId, weight] of neighbors) {
      const neighborCommunity = communities.get(neighborId)!;

      if (neighborCommunity === toCommunity) {
        gain += weight;
      } else if (neighborCommunity === fromCommunity) {
        gain -= weight;
      }
    }

    return gain;
  }

  /**
   * Calcula todas las métricas del grafo
   */
  calculateMetrics(): GraphMetrics {
    return {
      degreeCentrality: this.calculateDegreeCentrality(),
      betweennessCentrality: this.calculateBetweennessCentrality(),
      density: this.calculateDensity(),
      diameter: this.calculateDiameter(),
      communities: this.detectCommunities()
    };
  }

  /**
   * Exporta el grafo a formato JSON para análisis externo
   */
  exportToJSON(): string {
    return JSON.stringify({
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
      metrics: this.calculateMetrics(),
      timestamp: Date.now()
    }, null, 2);
  }

  /**
   * Obtiene los nodos más centrales
   */
  getTopNodes(metric: 'degree' | 'betweenness', limit: number = 3): Array<{ id: string; value: number }> {
    let centrality: Record<string, number>;

    if (metric === 'degree') {
      centrality = this.calculateDegreeCentrality();
    } else {
      centrality = this.calculateBetweennessCentrality();
    }

    return Object.entries(centrality)
      .map(([id, value]) => ({ id, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  }

  /**
   * Limpia el grafo (mantiene nodos, elimina edges)
   */
  reset(): void {
    this.edges = [];
    this.adjacency.clear();

    // Reinicializar adjacency y selection counts
    for (const [nodeId, node] of this.nodes) {
      this.adjacency.set(nodeId, new Map());
      node.selectionCount = 0;
      node.lastSelected = null;
    }
  }
}

/**
 * Crea una instancia del grafo desde datos iniciales
 */
export function createInteractionGraph(nodes: KeyNode[]): InteractionGraph {
  return new InteractionGraph(nodes);
}
