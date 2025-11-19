import { KeyNode } from '@/types';

export const UCI_KEYS: KeyNode[] = [
  { id: 'T1', label: 'Alerta respiratoria', color: '#EF4444', position: { x: 0.05, y: 0.1 }, radius: 60, selectionCount: 0, lastSelected: null },
  { id: 'T2', label: 'Alerta cardíaca', color: '#F59E0B', position: { x: 0.15, y: 0.1 }, radius: 60, selectionCount: 0, lastSelected: null },
  { id: 'T3', label: 'Fármacos urgentes', color: '#8B5CF6', position: { x: 0.25, y: 0.1 }, radius: 60, selectionCount: 0, lastSelected: null },
  { id: 'T4', label: 'Material estéril', color: '#06B6D4', position: { x: 0.35, y: 0.1 }, radius: 60, selectionCount: 0, lastSelected: null },
  { id: 'T5', label: 'Equipo quirúrgico', color: '#10B981', position: { x: 0.45, y: 0.1 }, radius: 60, selectionCount: 0, lastSelected: null },
  { id: 'T6', label: 'Sedación necesaria', color: '#6366F1', position: { x: 0.55, y: 0.1 }, radius: 60, selectionCount: 0, lastSelected: null },
  { id: 'T7', label: 'Hemodinamia', color: '#EC4899', position: { x: 0.65, y: 0.1 }, radius: 60, selectionCount: 0, lastSelected: null },
  { id: 'T8', label: 'Soporte ECMO', color: '#F97316', position: { x: 0.75, y: 0.1 }, radius: 60, selectionCount: 0, lastSelected: null },
  { id: 'T9', label: 'Aislamiento urgente', color: '#14B8A6', position: { x: 0.85, y: 0.1 }, radius: 60, selectionCount: 0, lastSelected: null },
  { id: 'T10', label: 'Apoyo inmediato', color: '#84CC16', position: { x: 0.95, y: 0.1 }, radius: 60, selectionCount: 0, lastSelected: null }
];

export const SELECTION_DURATION = 3000; // 3 segundos
export const PROXIMITY_THRESHOLD = 80; // pixels
export const HOVER_THRESHOLD = 60; // pixels
export const L_POSE_ANGLE_TOLERANCE = 30; // grados (más permisivo)
export const L_POSE_DURATION = 1000; // 1 segundo (reducido para respuesta rápida)
export const FPS_TARGET = 30;
