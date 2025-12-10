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
  leftArmGestureStart: number | null;
  rightArmGestureStart: number | null;
  leftHandLandmarks: HandLandmark[] | null;
  rightHandLandmarks: HandLandmark[] | null;
  gestureProgress: number; // 0-100 para barra de progreso
  gestureType: 'none' | 'starting' | 'stopping'; // Qué gesto se está detectando
  updateGestureState: (leftArmInL: boolean, rightArmInL: boolean, rightHandClosed?: boolean) => void;

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
  leftArmGestureStart: null,
  rightArmGestureStart: null,
  leftHandLandmarks: null,
  rightHandLandmarks: null,
  gestureProgress: 0,
  gestureType: 'none',
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

  updateGestureState: (leftArmInL: boolean, rightArmInL: boolean, rightHandClosed: boolean = false) => {
    const state = get();
    const now = Date.now();

    // TRANSICIÓN: IDLE → RECORDING (solo brazo IZQUIERDO en L)
    if (state.systemState === 'IDLE' && leftArmInL) {
      if (state.leftArmGestureStart === null) {
        console.log('⏱️ Brazo IZQUIERDO en L detectado - Iniciando cuenta regresiva...');
        set({ leftArmGestureStart: now, gestureType: 'starting' });
      } else {
        const elapsed = now - state.leftArmGestureStart;
        const progress = Math.min((elapsed / L_POSE_DURATION) * 100, 100);
        set({ gestureProgress: progress, gestureType: 'starting' });

        if (elapsed >= L_POSE_DURATION) {
          console.log('🎬 RECORDING STARTED - Brazo izquierdo en L confirmado');
          set({
            systemState: 'RECORDING',
            leftArmGestureStart: null,
            gestureProgress: 0,
            gestureType: 'none',
            selectedKeys: [],
            currentMessage: [],
            graph: createInteractionGraph(UCI_KEYS.map(k => ({ ...k })))
          });
        }
      }
    } else if (!leftArmInL && state.systemState === 'IDLE') {
      if (state.leftArmGestureStart !== null) {
        console.log('❌ Gesto de INICIO interrumpido - mantén el brazo izquierdo en L');
      }
      set({ leftArmGestureStart: null, gestureProgress: 0, gestureType: 'none' });
    }

    // TRANSICIÓN: RECORDING → PROCESSING (brazo DERECHO en L + mano cerrada/puño)
    const stopCondition = rightArmInL && rightHandClosed;

    if (state.systemState === 'RECORDING' && stopCondition) {
      if (state.rightArmGestureStart === null) {
        console.log('⏱️ Brazo DERECHO en L + PUÑO detectado - Iniciando cuenta regresiva para finalizar...');
        set({ rightArmGestureStart: now, gestureType: 'stopping' });
      } else {
        const elapsed = now - state.rightArmGestureStart;
        const progress = Math.min((elapsed / L_POSE_DURATION) * 100, 100);
        set({ gestureProgress: progress, gestureType: 'stopping' });

        if (elapsed >= L_POSE_DURATION) {
          console.log('⚙️ PROCESSING - Brazo derecho en L + puño confirmado');
          set({
            systemState: 'PROCESSING',
            rightArmGestureStart: null,
            gestureProgress: 0,
            gestureType: 'none',
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
      }
    } else if (!stopCondition && state.systemState === 'RECORDING') {
      if (state.rightArmGestureStart !== null) {
        console.log('❌ Gesto de FINALIZACIÓN interrumpido - mantén brazo derecho en L + puño');
      }
      set({ rightArmGestureStart: null, gestureProgress: 0, gestureType: 'none' });
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
      leftArmGestureStart: null,
      rightArmGestureStart: null,
      gestureProgress: 0,
      gestureType: 'none',
      metrics: null
    });
  }
}));
