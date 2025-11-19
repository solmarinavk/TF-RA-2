import { create } from 'zustand';
import { SystemState, PoseLandmark, HandLandmark, GraphEdge, GraphMetrics } from '@/types';
import { UCI_KEYS, L_POSE_DURATION } from '@/utils/constants';
import { InteractionGraph, createInteractionGraph } from '@/utils/graphEngine';

interface AppState {
  // === SISTEMA FSM ===
  systemState: SystemState;
  setSystemState: (state: SystemState) => void;

  // === LANDMARKS ===
  poseLandmarks: PoseLandmark[] | null;
  handLandmarks: { left: HandLandmark[] | null; right: HandLandmark[] | null };
  updatePoseLandmarks: (landmarks: PoseLandmark[] | null) => void;
  updateHandLandmarks: (left: HandLandmark[] | null, right: HandLandmark[] | null) => void;

  // === GESTURE DETECTION ===
  openHandGestureStart: number | null;
  closedHandGestureStart: number | null;
  leftHandLandmarks: HandLandmark[] | null;
  rightHandLandmarks: HandLandmark[] | null;
  updateGestureState: (armInL: boolean, handOpen: boolean, handClosed: boolean) => void;

  // === SELECTION ===
  selectedKeys: string[];
  hoveredKey: string | null;
  hoverStartTime: number | null;
  hoverProgress: number;
  addSelection: (keyId: string) => void;
  setHover: (keyId: string | null) => void;
  updateHoverProgress: (progress: number) => void;
  clearSelections: () => void;

  // === GRAFO ===
  graph: InteractionGraph;
  graphEdges: GraphEdge[];
  addInteraction: (fromKey: string, toKey: string) => void;

  // === MÉTRICAS ===
  metrics: GraphMetrics | null;
  calculateMetrics: () => void;

  // === MENSAJES ===
  currentMessage: string[];
  messages: string[][];
  completeMessage: () => void;

  // === RESET ===
  resetSession: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // ESTADO INICIAL
  systemState: 'IDLE',
  poseLandmarks: null,
  handLandmarks: { left: null, right: null },
  openHandGestureStart: null,
  closedHandGestureStart: null,
  leftHandLandmarks: null,
  rightHandLandmarks: null,
  selectedKeys: [],
  hoveredKey: null,
  hoverStartTime: null,
  hoverProgress: 0,
  graph: createInteractionGraph(UCI_KEYS.map(k => ({ ...k }))),
  graphEdges: [],
  metrics: null,
  currentMessage: [],
  messages: [],

  // ACTIONS
  setSystemState: (state: SystemState) => set({ systemState: state }),

  updatePoseLandmarks: (landmarks: PoseLandmark[] | null) => {
    set({ poseLandmarks: landmarks });
  },

  updateHandLandmarks: (left: HandLandmark[] | null, right: HandLandmark[] | null) => {
    set({ handLandmarks: { left, right } });
  },

  updateGestureState: (armInL: boolean, handOpen: boolean, handClosed: boolean) => {
    const state = get();
    const now = Date.now();

    // TRANSICIÓN: IDLE → RECORDING (brazo en L + palma abierta)
    if (state.systemState === 'IDLE' && armInL && handOpen) {
      if (state.openHandGestureStart === null) {
        set({ openHandGestureStart: now });
      } else if (now - state.openHandGestureStart >= L_POSE_DURATION) {
        console.log('🎬 RECORDING STARTED - L-Pose + Open Hand detected');
        set({
          systemState: 'RECORDING',
          openHandGestureStart: null,
          selectedKeys: [],
          currentMessage: [],
          graph: createInteractionGraph(UCI_KEYS.map(k => ({ ...k })))
        });
      }
    } else if (!(armInL && handOpen)) {
      set({ openHandGestureStart: null });
    }

    // TRANSICIÓN: RECORDING → PROCESSING (brazo en L + puño cerrado)
    if (state.systemState === 'RECORDING' && armInL && handClosed) {
      if (state.closedHandGestureStart === null) {
        set({ closedHandGestureStart: now });
      } else if (now - state.closedHandGestureStart >= L_POSE_DURATION) {
        console.log('⚙️ PROCESSING - L-Pose + Closed Hand detected');
        set({
          systemState: 'PROCESSING',
          closedHandGestureStart: null,
          hoveredKey: null,
          hoverProgress: 0
        });

        // Calcular métricas
        setTimeout(() => {
          get().calculateMetrics();
          get().completeMessage();
          set({ systemState: 'DISPLAYING' });
          console.log('✅ DISPLAYING - Metrics calculated');
        }, 500);
      }
    } else if (!(armInL && handClosed)) {
      set({ closedHandGestureStart: null });
    }
  },

  setHover: (keyId: string | null) => {
    const state = get();

    if (state.systemState !== 'RECORDING') return;

    if (keyId !== state.hoveredKey) {
      set({
        hoveredKey: keyId,
        hoverStartTime: keyId ? Date.now() : null,
        hoverProgress: 0
      });
    }
  },

  updateHoverProgress: (progress: number) => {
    set({ hoverProgress: progress });
  },

  addSelection: (keyId: string) => {
    const state = get();

    if (state.systemState !== 'RECORDING') return;

    const keyNode = UCI_KEYS.find(k => k.id === keyId);
    if (!keyNode) return;

    console.log(`✅ Selected: ${keyNode.label}`);

    // Añadir a mensaje actual
    const newMessage = [...state.currentMessage, keyNode.label];

    // Añadir edge al grafo si hay selección previa
    if (state.selectedKeys.length > 0) {
      const prevKey = state.selectedKeys[state.selectedKeys.length - 1];
      state.graph.addEdge(prevKey, keyId);
    }

    set({
      selectedKeys: [...state.selectedKeys, keyId],
      currentMessage: newMessage,
      graphEdges: state.graph.edges,
      hoveredKey: null,
      hoverStartTime: null,
      hoverProgress: 0
    });
  },

  addInteraction: (fromKey: string, toKey: string) => {
    const state = get();
    state.graph.addEdge(fromKey, toKey);
    set({ graphEdges: state.graph.edges });
  },

  calculateMetrics: () => {
    const state = get();
    const metrics = state.graph.calculateMetrics();
    console.log('📊 Metrics calculated:', metrics);
    set({ metrics });
  },

  clearSelections: () => {
    set({
      selectedKeys: [],
      currentMessage: [],
      hoveredKey: null,
      hoverStartTime: null,
      hoverProgress: 0
    });
  },

  completeMessage: () => {
    const state = get();
    if (state.currentMessage.length > 0) {
      set({
        messages: [...state.messages, state.currentMessage]
      });
    }
  },

  resetSession: () => {
    console.log('🔄 RESET - Returning to IDLE');
    set({
      systemState: 'IDLE',
      selectedKeys: [],
      hoveredKey: null,
      hoverStartTime: null,
      hoverProgress: 0,
      currentMessage: [],
      openHandGestureStart: null,
      closedHandGestureStart: null,
      metrics: null
    });
  }
}));
