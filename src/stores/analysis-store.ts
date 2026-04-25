import { create } from 'zustand';
import type {
  AnalysisReport,
  HistoryItem,
  AnalysisTask,
} from '@/types/stock';

interface AnalysisState {
  // State
  query: string;
  isAnalyzing: boolean;
  currentReport: AnalysisReport | null;
  historyItems: HistoryItem[];
  selectedHistoryId: string | null;
  error: string | null;
  activeTasks: AnalysisTask[];

  // Setters
  setQuery: (q: string) => void;
  setIsAnalyzing: (v: boolean) => void;
  setCurrentReport: (r: AnalysisReport | null) => void;
  setHistoryItems: (items: HistoryItem[]) => void;
  setSelectedHistoryId: (id: string | null) => void;
  setError: (e: string | null) => void;
  setActiveTasks: (tasks: AnalysisTask[]) => void;

  // Actions
  submitAnalysis: (code: string, name: string) => Promise<void>;
  loadHistory: () => Promise<void>;
  selectReport: (id: string) => Promise<void>;
  pollTasks: () => Promise<void>;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  query: '',
  isAnalyzing: false,
  currentReport: null,
  historyItems: [],
  selectedHistoryId: null,
  error: null,
  activeTasks: [],

  setQuery: (q) => set({ query: q }),
  setIsAnalyzing: (v) => set({ isAnalyzing: v }),
  setCurrentReport: (r) => set({ currentReport: r }),
  setHistoryItems: (items) => set({ historyItems: items }),
  setSelectedHistoryId: (id) => set({ selectedHistoryId: id }),
  setError: (e) => set({ error: e }),
  setActiveTasks: (tasks) => set({ activeTasks: tasks }),

  submitAnalysis: async (code: string, name: string) => {
    set({ isAnalyzing: true, error: null, currentReport: null });

    try {
      // Create a task first
      const taskRes = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'analysis', stockCode: code, stockName: name }),
      });
      if (!taskRes.ok) throw new Error('Failed to create task');
      const task = await taskRes.json();

      // Start polling tasks
      get().pollTasks();

      // Kick off the analysis
      const res = await fetch('/api/analysis/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockCode: code, stockName: name }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Analysis failed');
      }

      const report: AnalysisReport = await res.json();

      set({
        isAnalyzing: false,
        currentReport: report,
        selectedHistoryId: report.id,
      });

      // Reload history to include new entry
      get().loadHistory();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({ isAnalyzing: false, error: message });
    }
  },

  loadHistory: async () => {
    try {
      const res = await fetch('/api/analysis');
      if (!res.ok) return;
      const data = await res.json();
      set({ historyItems: data });
    } catch {
      // silently fail
    }
  },

  selectReport: async (id: string) => {
    set({ selectedHistoryId: id, error: null });
    try {
      const res = await fetch(`/api/analysis/${id}`);
      if (!res.ok) throw new Error('Failed to load report');
      const data: AnalysisReport = await res.json();
      set({ currentReport: data });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load report';
      set({ error: message });
    }
  },

  pollTasks: async () => {
    const poll = async () => {
      try {
        const res = await fetch('/api/tasks');
        if (!res.ok) return;
        const tasks: AnalysisTask[] = await res.json();
        set({ activeTasks: tasks });
      } catch {
        // silently fail
      }
    };
    await poll();
    const interval = setInterval(poll, 2000);
    // Auto-stop after 5 minutes
    setTimeout(() => clearInterval(interval), 5 * 60 * 1000);
  },
}));
