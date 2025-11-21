import { KeyNode, GraphEdge, GraphMetrics } from '@/types';

/**
 * Motor de grafos avanzado para análisis de interacciones UCI
 * Implementa métricas estructurales, centralidades, robustez,
 * detección de comunidades, análisis de transiciones y modelos de difusión
 */
export class InteractionGraph {
  nodes: Map<string, KeyNode>;
  adjacency: Map<string, Map<string, number>>; // lista de adyacencia con pesos
  edges: GraphEdge[];
  transitionSequence: string[]; // Secuencia temporal de selecciones

  constructor(initialNodes: KeyNode[]) {
    this.nodes = new Map(initialNodes.map(node => [node.id, { ...node }]));
    this.adjacency = new Map();
    this.edges = [];
    this.transitionSequence = [];

    for (const node of initialNodes) {
      this.adjacency.set(node.id, new Map());
    }
  }

  /**
   * Añade una arista dirigida del nodo from al nodo to
   */
  addEdge(from: string, to: string): void {
    if (!this.nodes.has(from) || !this.nodes.has(to)) return;

    const fromAdj = this.adjacency.get(from)!;
    const currentWeight = fromAdj.get(to) || 0;
    fromAdj.set(to, currentWeight + 1);

    const existingEdge = this.edges.find(e => e.from === from && e.to === to);
    if (existingEdge) {
      existingEdge.weight++;
      existingEdge.timestamp = Date.now();
    } else {
      this.edges.push({ from, to, weight: 1, timestamp: Date.now() });
    }

    // Registrar transición
    this.transitionSequence.push(to);

    const toNode = this.nodes.get(to)!;
    toNode.selectionCount++;
    toNode.lastSelected = Date.now();
  }

  // ============== CENTRALIDADES ==============

  getInDegree(nodeId: string): number {
    let inDegree = 0;
    for (const [_, neighbors] of this.adjacency) {
      if (neighbors.has(nodeId)) inDegree += neighbors.get(nodeId)!;
    }
    return inDegree;
  }

  getOutDegree(nodeId: string): number {
    const neighbors = this.adjacency.get(nodeId);
    if (!neighbors) return 0;
    let outDegree = 0;
    for (const weight of neighbors.values()) outDegree += weight;
    return outDegree;
  }

  calculateDegreeCentrality(): Record<string, number> {
    const n = this.nodes.size;
    if (n <= 1) return {};

    const centrality: Record<string, number> = {};
    for (const [nodeId] of this.nodes) {
      const total = this.getInDegree(nodeId) + this.getOutDegree(nodeId);
      centrality[nodeId] = total / (2 * (n - 1));
    }
    return centrality;
  }

  calculateBetweennessCentrality(): Record<string, number> {
    const centrality: Record<string, number> = {};
    for (const [nodeId] of this.nodes) centrality[nodeId] = 0;

    for (const [source] of this.nodes) {
      const stack: string[] = [];
      const predecessors = new Map<string, string[]>();
      const sigma = new Map<string, number>();
      const distance = new Map<string, number>();
      const delta = new Map<string, number>();

      for (const [nodeId] of this.nodes) {
        predecessors.set(nodeId, []);
        sigma.set(nodeId, 0);
        distance.set(nodeId, -1);
        delta.set(nodeId, 0);
      }

      sigma.set(source, 1);
      distance.set(source, 0);
      const queue: string[] = [source];

      while (queue.length > 0) {
        const v = queue.shift()!;
        stack.push(v);
        const neighbors = this.adjacency.get(v)!;
        for (const [w] of neighbors) {
          if (distance.get(w)! < 0) {
            queue.push(w);
            distance.set(w, distance.get(v)! + 1);
          }
          if (distance.get(w)! === distance.get(v)! + 1) {
            sigma.set(w, sigma.get(w)! + sigma.get(v)!);
            predecessors.get(w)!.push(v);
          }
        }
      }

      while (stack.length > 0) {
        const w = stack.pop()!;
        for (const v of predecessors.get(w)!) {
          const factor = (sigma.get(v)! / sigma.get(w)!) * (1 + delta.get(w)!);
          delta.set(v, delta.get(v)! + factor);
        }
        if (w !== source) centrality[w] += delta.get(w)!;
      }
    }

    const n = this.nodes.size;
    const normFactor = n > 2 ? 1 / ((n - 1) * (n - 2)) : 1;
    for (const nodeId in centrality) centrality[nodeId] *= normFactor;
    return centrality;
  }

  /**
   * Closeness Centrality - qué tan cerca está un nodo de todos los demás
   */
  calculateClosenessCentrality(): Record<string, number> {
    const centrality: Record<string, number> = {};
    const n = this.nodes.size;

    for (const [nodeId] of this.nodes) {
      const distances = this.bfs(nodeId);
      let totalDistance = 0;
      let reachable = 0;

      for (const [target, dist] of distances) {
        if (target !== nodeId && dist >= 0) {
          totalDistance += dist;
          reachable++;
        }
      }

      centrality[nodeId] = reachable > 0 ? reachable / totalDistance : 0;
      // Normalizar
      if (n > 1) centrality[nodeId] *= (reachable / (n - 1));
    }
    return centrality;
  }

  /**
   * Eigenvector Centrality - influencia basada en conexiones a nodos influyentes
   */
  calculateEigenvectorCentrality(iterations: number = 100): Record<string, number> {
    const centrality: Record<string, number> = {};
    const n = this.nodes.size;
    if (n === 0) return centrality;

    // Inicializar con valores iguales
    for (const [nodeId] of this.nodes) {
      centrality[nodeId] = 1 / n;
    }

    for (let iter = 0; iter < iterations; iter++) {
      const newCentrality: Record<string, number> = {};
      let sum = 0;

      for (const [nodeId] of this.nodes) {
        let score = 0;
        // Sumar centralidad de vecinos entrantes
        for (const [_, neighbors] of this.adjacency) {
          if (neighbors.has(nodeId)) {
            const sourceId = Array.from(this.adjacency.entries())
              .find(([_, adj]) => adj === neighbors)?.[0];
            if (sourceId) score += centrality[sourceId] * neighbors.get(nodeId)!;
          }
        }
        newCentrality[nodeId] = score;
        sum += score * score;
      }

      // Normalizar
      const norm = Math.sqrt(sum) || 1;
      for (const nodeId in newCentrality) {
        centrality[nodeId] = newCentrality[nodeId] / norm;
      }
    }
    return centrality;
  }

  /**
   * PageRank - algoritmo de Google adaptado para grafos dirigidos
   */
  calculatePageRank(damping: number = 0.85, iterations: number = 100): Record<string, number> {
    const pageRank: Record<string, number> = {};
    const n = this.nodes.size;
    if (n === 0) return pageRank;

    // Inicializar
    for (const [nodeId] of this.nodes) {
      pageRank[nodeId] = 1 / n;
    }

    for (let iter = 0; iter < iterations; iter++) {
      const newRank: Record<string, number> = {};

      for (const [nodeId] of this.nodes) {
        let incomingRank = 0;

        // Encontrar nodos que apuntan a este nodo
        for (const [sourceId, neighbors] of this.adjacency) {
          if (neighbors.has(nodeId)) {
            const outDegree = this.getOutDegree(sourceId);
            if (outDegree > 0) {
              incomingRank += pageRank[sourceId] / outDegree;
            }
          }
        }

        newRank[nodeId] = (1 - damping) / n + damping * incomingRank;
      }

      for (const nodeId in newRank) {
        pageRank[nodeId] = newRank[nodeId];
      }
    }
    return pageRank;
  }

  // ============== MÉTRICAS TOPOLÓGICAS ==============

  calculateDensity(): number {
    const n = this.nodes.size;
    if (n <= 1) return 0;
    return this.edges.length / (n * (n - 1));
  }

  calculateDiameter(): number | null {
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
   * Average Path Length - longitud promedio de caminos
   */
  calculateAveragePathLength(): number | null {
    let totalDistance = 0;
    let pathCount = 0;

    for (const [source] of this.nodes) {
      const distances = this.bfs(source);
      for (const [target, distance] of distances) {
        if (source !== target && distance >= 0) {
          totalDistance += distance;
          pathCount++;
        }
      }
    }
    return pathCount > 0 ? totalDistance / pathCount : null;
  }

  /**
   * Clustering Coefficient Global
   */
  calculateClusteringCoefficient(): number {
    let totalCoeff = 0;
    let nodesWithNeighbors = 0;

    for (const [nodeId] of this.nodes) {
      const neighbors = new Set<string>();

      // Vecinos salientes
      const outNeighbors = this.adjacency.get(nodeId)!;
      for (const [n] of outNeighbors) neighbors.add(n);

      // Vecinos entrantes
      for (const [sourceId, adj] of this.adjacency) {
        if (adj.has(nodeId)) neighbors.add(sourceId);
      }

      const k = neighbors.size;
      if (k < 2) continue;

      nodesWithNeighbors++;
      let triangles = 0;
      const neighborArray = Array.from(neighbors);

      for (let i = 0; i < neighborArray.length; i++) {
        for (let j = i + 1; j < neighborArray.length; j++) {
          const ni = neighborArray[i];
          const nj = neighborArray[j];
          // Verificar si hay conexión entre vecinos
          if (this.adjacency.get(ni)?.has(nj) || this.adjacency.get(nj)?.has(ni)) {
            triangles++;
          }
        }
      }

      const possibleTriangles = (k * (k - 1)) / 2;
      totalCoeff += triangles / possibleTriangles;
    }

    return nodesWithNeighbors > 0 ? totalCoeff / nodesWithNeighbors : 0;
  }

  private bfs(source: string): Map<string, number> {
    const distances = new Map<string, number>();
    for (const [nodeId] of this.nodes) distances.set(nodeId, -1);

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

  // ============== COMUNIDADES ==============

  detectCommunities(): Record<number, string[]> {
    const communities = new Map<string, number>();
    let communityId = 0;

    for (const [nodeId] of this.nodes) {
      communities.set(nodeId, communityId++);
    }

    let improved = true;
    let iterations = 0;

    while (improved && iterations < 10) {
      improved = false;
      iterations++;

      for (const [nodeId] of this.nodes) {
        const currentCommunity = communities.get(nodeId)!;
        let bestCommunity = currentCommunity;
        let bestGain = 0;

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

    const result: Record<number, string[]> = {};
    for (const [nodeId, commId] of communities) {
      if (!result[commId]) result[commId] = [];
      result[commId].push(nodeId);
    }
    return result;
  }

  private calculateModularityGain(
    nodeId: string, fromCommunity: number, toCommunity: number,
    communities: Map<string, number>
  ): number {
    let gain = 0;
    const neighbors = this.adjacency.get(nodeId)!;

    for (const [neighborId, weight] of neighbors) {
      const neighborCommunity = communities.get(neighborId)!;
      if (neighborCommunity === toCommunity) gain += weight;
      else if (neighborCommunity === fromCommunity) gain -= weight;
    }
    return gain;
  }

  /**
   * Modularity Score - calidad de la partición en comunidades
   */
  calculateModularity(communities: Record<number, string[]>): number {
    const m = this.edges.reduce((sum, e) => sum + e.weight, 0);
    if (m === 0) return 0;

    let q = 0;
    const nodeToComm = new Map<string, number>();

    for (const [commId, nodes] of Object.entries(communities)) {
      for (const nodeId of nodes) {
        nodeToComm.set(nodeId, parseInt(commId));
      }
    }

    for (const [i] of this.nodes) {
      for (const [j] of this.nodes) {
        if (nodeToComm.get(i) !== nodeToComm.get(j)) continue;

        const aij = this.adjacency.get(i)?.get(j) || 0;
        const ki = this.getOutDegree(i);
        const kj = this.getInDegree(j);

        q += aij - (ki * kj) / (2 * m);
      }
    }
    return q / (2 * m);
  }

  // ============== ROBUSTEZ ==============

  calculateRobustness(): {
    criticalNodes: string[];
    vulnerabilityScore: number;
    connectivityAfterRemoval: number;
  } {
    const originalConnectivity = this.calculateConnectivity();
    const vulnerabilities: Array<{ nodeId: string; impact: number }> = [];

    for (const [nodeId] of this.nodes) {
      // Simular eliminación del nodo
      const tempAdj = new Map(this.adjacency);
      tempAdj.delete(nodeId);

      for (const [_, neighbors] of tempAdj) {
        neighbors.delete(nodeId);
      }

      const newConnectivity = this.calculateConnectivityForAdjacency(tempAdj);
      const impact = originalConnectivity - newConnectivity;
      vulnerabilities.push({ nodeId, impact });
    }

    vulnerabilities.sort((a, b) => b.impact - a.impact);

    const criticalNodes = vulnerabilities.slice(0, 3).map(v => v.nodeId);
    const maxImpact = vulnerabilities[0]?.impact || 0;
    const vulnerabilityScore = originalConnectivity > 0 ? maxImpact / originalConnectivity : 0;
    const connectivityAfterRemoval = originalConnectivity - maxImpact;

    return { criticalNodes, vulnerabilityScore, connectivityAfterRemoval };
  }

  private calculateConnectivity(): number {
    return this.calculateConnectivityForAdjacency(this.adjacency);
  }

  private calculateConnectivityForAdjacency(adj: Map<string, Map<string, number>>): number {
    let reachablePairs = 0;
    const nodes = Array.from(adj.keys());

    for (const source of nodes) {
      const visited = new Set<string>([source]);
      const queue = [source];

      while (queue.length > 0) {
        const current = queue.shift()!;
        const neighbors = adj.get(current);
        if (neighbors) {
          for (const [neighbor] of neighbors) {
            if (!visited.has(neighbor) && adj.has(neighbor)) {
              visited.add(neighbor);
              queue.push(neighbor);
              reachablePairs++;
            }
          }
        }
      }
    }
    return reachablePairs;
  }

  // ============== ANÁLISIS DE TRANSICIONES ==============

  calculateTransitionAnalysis(): {
    mostCommonPath: string[];
    transitionMatrix: Record<string, Record<string, number>>;
    entropy: number;
    burstiness: number;
  } {
    // Matriz de transición
    const transitionMatrix: Record<string, Record<string, number>> = {};
    const transitionCounts: Record<string, number> = {};

    for (const [nodeId] of this.nodes) {
      transitionMatrix[nodeId] = {};
      for (const [targetId] of this.nodes) {
        transitionMatrix[nodeId][targetId] = 0;
      }
    }

    // Contar transiciones
    for (const edge of this.edges) {
      transitionCounts[edge.from] = (transitionCounts[edge.from] || 0) + edge.weight;
    }

    // Calcular probabilidades
    for (const edge of this.edges) {
      const total = transitionCounts[edge.from] || 1;
      transitionMatrix[edge.from][edge.to] = edge.weight / total;
    }

    // Entropía de transiciones
    let entropy = 0;
    for (const from in transitionMatrix) {
      for (const to in transitionMatrix[from]) {
        const p = transitionMatrix[from][to];
        if (p > 0) entropy -= p * Math.log2(p);
      }
    }
    entropy = entropy / (this.nodes.size || 1);

    // Burstiness - irregularidad temporal
    const timestamps = this.edges.map(e => e.timestamp).sort((a, b) => a - b);
    let burstiness = 0;
    if (timestamps.length > 1) {
      const intervals: number[] = [];
      for (let i = 1; i < timestamps.length; i++) {
        intervals.push(timestamps[i] - timestamps[i - 1]);
      }
      const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const std = Math.sqrt(intervals.reduce((sum, x) => sum + (x - mean) ** 2, 0) / intervals.length);
      burstiness = (std - mean) / (std + mean + 0.001);
    }

    // Camino más común (secuencia de 3)
    const pathCounts: Record<string, number> = {};
    for (let i = 0; i < this.transitionSequence.length - 2; i++) {
      const path = this.transitionSequence.slice(i, i + 3).join('->');
      pathCounts[path] = (pathCounts[path] || 0) + 1;
    }

    let mostCommonPath: string[] = [];
    let maxCount = 0;
    for (const [path, count] of Object.entries(pathCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonPath = path.split('->');
      }
    }

    return { mostCommonPath, transitionMatrix, entropy, burstiness };
  }

  // ============== MODELO DE DIFUSIÓN ==============

  calculateDiffusionModel(): {
    spreadPotential: Record<string, number>;
    activationThreshold: number;
    cascadeSize: number;
  } {
    // Potencial de difusión basado en centralidad y conexiones salientes
    const pageRank = this.calculatePageRank();
    const spreadPotential: Record<string, number> = {};

    for (const [nodeId] of this.nodes) {
      const outDegree = this.getOutDegree(nodeId);
      const pr = pageRank[nodeId] || 0;
      spreadPotential[nodeId] = (outDegree * 0.5 + pr * 0.5) * (this.nodes.size > 0 ? this.nodes.size : 1);
    }

    // Normalizar
    const maxPotential = Math.max(...Object.values(spreadPotential), 1);
    for (const nodeId in spreadPotential) {
      spreadPotential[nodeId] /= maxPotential;
    }

    // Umbral de activación promedio
    const density = this.calculateDensity();
    const activationThreshold = 1 - density;

    // Simular cascada desde el nodo más central
    const topNode = Object.entries(spreadPotential).sort((a, b) => b[1] - a[1])[0]?.[0];
    let cascadeSize = 0;

    if (topNode) {
      const activated = new Set<string>([topNode]);
      const queue = [topNode];

      while (queue.length > 0) {
        const current = queue.shift()!;
        const neighbors = this.adjacency.get(current);

        if (neighbors) {
          for (const [neighbor, weight] of neighbors) {
            if (!activated.has(neighbor)) {
              // Probabilidad de activación basada en peso
              const prob = weight / (this.getInDegree(neighbor) || 1);
              if (prob > activationThreshold * 0.5) {
                activated.add(neighbor);
                queue.push(neighbor);
              }
            }
          }
        }
      }
      cascadeSize = activated.size / this.nodes.size;
    }

    return { spreadPotential, activationThreshold, cascadeSize };
  }

  // ============== MÉTRICAS COMPLETAS ==============

  calculateMetrics(): GraphMetrics {
    const communities = this.detectCommunities();
    const transitions = this.calculateTransitionAnalysis();
    const diffusion = this.calculateDiffusionModel();
    const robustness = this.calculateRobustness();

    return {
      degreeCentrality: this.calculateDegreeCentrality(),
      betweennessCentrality: this.calculateBetweennessCentrality(),
      closenessCentrality: this.calculateClosenessCentrality(),
      eigenvectorCentrality: this.calculateEigenvectorCentrality(),
      pageRank: this.calculatePageRank(),
      density: this.calculateDensity(),
      diameter: this.calculateDiameter(),
      averagePathLength: this.calculateAveragePathLength(),
      clusteringCoefficient: this.calculateClusteringCoefficient(),
      communities,
      modularity: this.calculateModularity(communities),
      robustness,
      transitions,
      diffusion
    };
  }

  getTopNodes(metric: 'degree' | 'betweenness' | 'pagerank', limit: number = 3): Array<{ id: string; value: number }> {
    let centrality: Record<string, number>;

    switch (metric) {
      case 'degree':
        centrality = this.calculateDegreeCentrality();
        break;
      case 'betweenness':
        centrality = this.calculateBetweennessCentrality();
        break;
      case 'pagerank':
        centrality = this.calculatePageRank();
        break;
      default:
        centrality = this.calculateDegreeCentrality();
    }

    return Object.entries(centrality)
      .map(([id, value]) => ({ id, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  }

  exportToJSON(): string {
    return JSON.stringify({
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
      metrics: this.calculateMetrics(),
      transitionSequence: this.transitionSequence,
      timestamp: Date.now()
    }, null, 2);
  }

  reset(): void {
    this.edges = [];
    this.transitionSequence = [];
    this.adjacency.clear();

    for (const [nodeId, node] of this.nodes) {
      this.adjacency.set(nodeId, new Map());
      node.selectionCount = 0;
      node.lastSelected = null;
    }
  }
}

export function createInteractionGraph(nodes: KeyNode[]): InteractionGraph {
  return new InteractionGraph(nodes);
}
