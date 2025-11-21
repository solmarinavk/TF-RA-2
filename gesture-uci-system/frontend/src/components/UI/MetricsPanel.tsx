import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraphMetrics, KeyNode } from '@/types';

interface MetricsPanelProps {
  metrics: GraphMetrics;
  keys: KeyNode[];
  onReset: () => void;
}

type TabType = 'centralidad' | 'topologia' | 'comunidades' | 'robustez' | 'transiciones' | 'difusion';

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics, keys, onReset }) => {
  const [activeTab, setActiveTab] = useState<TabType>('centralidad');

  const getKeyLabel = (id: string) => keys.find(k => k.id === id)?.label || id;
  const getKeyColor = (id: string) => keys.find(k => k.id === id)?.color || '#666';

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'centralidad', label: 'Centralidades', icon: '🎯' },
    { id: 'topologia', label: 'Topología', icon: '🔗' },
    { id: 'comunidades', label: 'Comunidades', icon: '👥' },
    { id: 'robustez', label: 'Robustez', icon: '🛡️' },
    { id: 'transiciones', label: 'Transiciones', icon: '🔄' },
    { id: 'difusion', label: 'Difusión', icon: '🌊' },
  ];

  const formatPercent = (v: number) => `${(v * 100).toFixed(1)}%`;
  const formatNumber = (v: number | null) => v !== null ? v.toFixed(2) : 'N/A';

  const getTopEntries = (obj: Record<string, number>, n: number = 3) => {
    return Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n);
  };

  return (
    <motion.div
      className="fixed inset-4 md:inset-8 z-50 bg-slate-900/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 flex flex-col overflow-hidden"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, type: 'spring' }}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>📊</span> Análisis Completo del Grafo de Interacción
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Métricas estructurales, centralidades, robustez y modelos de difusión
          </p>
        </div>
        <button
          onClick={onReset}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors text-sm"
        >
          Nuevo Mensaje
        </button>
      </div>

      {/* Tabs */}
      <div className="px-4 py-2 border-b border-slate-700/30 flex gap-1 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'centralidad' && (
            <motion.div
              key="centralidad"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {/* Degree Centrality */}
              <MetricCard title="Centralidad de Grado" description="Importancia por número de conexiones">
                {getTopEntries(metrics.degreeCentrality).map(([id, value]) => (
                  <NodeBar key={id} label={getKeyLabel(id)} value={value} color={getKeyColor(id)} />
                ))}
              </MetricCard>

              {/* Betweenness */}
              <MetricCard title="Intermediación" description="Control sobre flujo de información">
                {getTopEntries(metrics.betweennessCentrality).map(([id, value]) => (
                  <NodeBar key={id} label={getKeyLabel(id)} value={value} color={getKeyColor(id)} />
                ))}
              </MetricCard>

              {/* Closeness */}
              <MetricCard title="Cercanía" description="Proximidad a todos los nodos">
                {getTopEntries(metrics.closenessCentrality).map(([id, value]) => (
                  <NodeBar key={id} label={getKeyLabel(id)} value={value} color={getKeyColor(id)} />
                ))}
              </MetricCard>

              {/* PageRank */}
              <MetricCard title="PageRank" description="Importancia por enlaces entrantes">
                {getTopEntries(metrics.pageRank).map(([id, value]) => (
                  <NodeBar key={id} label={getKeyLabel(id)} value={value} color={getKeyColor(id)} />
                ))}
              </MetricCard>

              {/* Eigenvector */}
              <MetricCard title="Eigenvector" description="Influencia por conexiones influyentes">
                {getTopEntries(metrics.eigenvectorCentrality).map(([id, value]) => (
                  <NodeBar key={id} label={getKeyLabel(id)} value={value} color={getKeyColor(id)} />
                ))}
              </MetricCard>
            </motion.div>
          )}

          {activeTab === 'topologia' && (
            <motion.div
              key="topologia"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <StatCard label="Densidad" value={formatPercent(metrics.density)} icon="🕸️" color="emerald" />
              <StatCard label="Diámetro" value={metrics.diameter?.toString() || 'N/A'} icon="📏" color="blue" />
              <StatCard label="Camino Promedio" value={formatNumber(metrics.averagePathLength)} icon="🛤️" color="purple" />
              <StatCard label="Coef. Clustering" value={formatPercent(metrics.clusteringCoefficient)} icon="🔺" color="orange" />
            </motion.div>
          )}

          {activeTab === 'comunidades' && (
            <motion.div
              key="comunidades"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-4 mb-6">
                <StatCard
                  label="Comunidades Detectadas"
                  value={Object.keys(metrics.communities).length.toString()}
                  icon="👥"
                  color="purple"
                />
                <StatCard
                  label="Modularidad (Q)"
                  value={formatNumber(metrics.modularity)}
                  icon="📐"
                  color="blue"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(metrics.communities).map(([commId, nodes]) => (
                  <div key={commId} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
                    <h4 className="text-sm font-semibold text-slate-300 mb-3">
                      Comunidad {parseInt(commId) + 1}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {nodes.map(nodeId => (
                        <span
                          key={nodeId}
                          className="px-2 py-1 rounded text-xs text-white"
                          style={{ backgroundColor: getKeyColor(nodeId) }}
                        >
                          {getKeyLabel(nodeId)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'robustez' && (
            <motion.div
              key="robustez"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard
                  label="Vulnerabilidad"
                  value={formatPercent(metrics.robustness.vulnerabilityScore)}
                  icon="⚠️"
                  color={metrics.robustness.vulnerabilityScore > 0.5 ? 'red' : 'emerald'}
                />
                <StatCard
                  label="Conectividad Post-Ataque"
                  value={metrics.robustness.connectivityAfterRemoval.toFixed(0)}
                  icon="🔌"
                  color="blue"
                />
              </div>

              <MetricCard title="Nodos Críticos" description="Su eliminación fragmentaría más la red">
                {metrics.robustness.criticalNodes.map((nodeId, i) => (
                  <div key={nodeId} className="flex items-center gap-3 py-2">
                    <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getKeyColor(nodeId) }}
                    />
                    <span className="text-slate-300 text-sm">{getKeyLabel(nodeId)}</span>
                  </div>
                ))}
              </MetricCard>
            </motion.div>
          )}

          {activeTab === 'transiciones' && (
            <motion.div
              key="transiciones"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard
                  label="Entropía"
                  value={formatNumber(metrics.transitions.entropy)}
                  icon="🎲"
                  color="purple"
                  description="Mayor = menos predecible"
                />
                <StatCard
                  label="Burstiness"
                  value={formatNumber(metrics.transitions.burstiness)}
                  icon="⚡"
                  color="orange"
                  description="+1=burst, -1=regular"
                />
              </div>

              {metrics.transitions.mostCommonPath.length > 0 && (
                <MetricCard title="Secuencia Más Frecuente" description="Patrón de transición dominante">
                  <div className="flex items-center gap-2 flex-wrap">
                    {metrics.transitions.mostCommonPath.map((nodeId, i) => (
                      <React.Fragment key={i}>
                        <span
                          className="px-3 py-1.5 rounded-full text-sm text-white"
                          style={{ backgroundColor: getKeyColor(nodeId) }}
                        >
                          {getKeyLabel(nodeId)}
                        </span>
                        {i < metrics.transitions.mostCommonPath.length - 1 && (
                          <span className="text-slate-500">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </MetricCard>
              )}
            </motion.div>
          )}

          {activeTab === 'difusion' && (
            <motion.div
              key="difusion"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard
                  label="Umbral Activación"
                  value={formatPercent(metrics.diffusion.activationThreshold)}
                  icon="🎚️"
                  color="blue"
                />
                <StatCard
                  label="Tamaño Cascada"
                  value={formatPercent(metrics.diffusion.cascadeSize)}
                  icon="🌊"
                  color="emerald"
                  description="% red alcanzada"
                />
              </div>

              <MetricCard title="Potencial de Difusión" description="Capacidad de cada nodo para propagar información">
                {getTopEntries(metrics.diffusion.spreadPotential, 5).map(([id, value]) => (
                  <NodeBar key={id} label={getKeyLabel(id)} value={value} color={getKeyColor(id)} />
                ))}
              </MetricCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Componentes auxiliares
const MetricCard: React.FC<{
  title: string;
  description: string;
  children: React.ReactNode;
}> = ({ title, description, children }) => (
  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
    <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
    <p className="text-xs text-slate-500 mb-4">{description}</p>
    <div className="space-y-2">{children}</div>
  </div>
);

const NodeBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span className="text-slate-300 truncate">{label}</span>
      <span className="text-slate-500">{(value * 100).toFixed(1)}%</span>
    </div>
    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(value * 100, 100)}%`, backgroundColor: color }}
      />
    </div>
  </div>
);

const StatCard: React.FC<{
  label: string;
  value: string;
  icon: string;
  color: 'emerald' | 'blue' | 'purple' | 'orange' | 'red';
  description?: string;
}> = ({ label, value, icon, color, description }) => {
  const colors = {
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    orange: 'text-orange-400',
    red: 'text-red-400',
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${colors[color]}`}>{value}</div>
      {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
    </div>
  );
};
