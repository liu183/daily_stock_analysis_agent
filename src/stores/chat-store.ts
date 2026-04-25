import { create } from 'zustand';

export interface ThinkingStep {
  type: 'thinking' | 'tool_start' | 'tool_done' | 'generating';
  message?: string;
  tool?: string;
  display_name?: string;
  duration?: number;
  success?: boolean;
  step?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  skillName?: string;
  thinkingSteps?: ThinkingStep[];
  createdAt: string;
}

export interface ChatSession {
  id: string;
  title: string;
  stockCode?: string;
  stockName?: string;
  messageCount: number;
  lastActive: string;
}

interface ChatStore {
  messages: ChatMessage[];
  sessions: ChatSession[];
  currentSessionId: string | null;
  isLoading: boolean;
  chatError: string | null;
  progressSteps: ThinkingStep[];

  loadSessions: () => Promise<void>;
  startNewChat: () => void;
  switchSession: (id: string) => void;
  sendMessage: (message: string, skill?: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  loadSessionMessages: (sessionId: string) => Promise<void>;
  clearError: () => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  sessions: [],
  currentSessionId: null,
  isLoading: false,
  chatError: null,
  progressSteps: [],

  clearError: () => set({ chatError: null }),

  loadSessions: async () => {
    try {
      const res = await fetch('/api/chat');
      if (!res.ok) throw new Error('Failed to load sessions');
      const data = await res.json();
      const sessions: ChatSession[] = data.map((s: Record<string, unknown>) => ({
        id: s.id as string,
        title: s.title as string,
        stockCode: (s.stockCode as string) || undefined,
        stockName: (s.stockName as string) || undefined,
        messageCount: s.messageCount as number,
        lastActive: formatRelativeTime(s.updatedAt as string),
        _rawDate: s.updatedAt as string,
      }));
      set({ sessions });
    } catch {
      // silently fail on first load
    }
  },

  startNewChat: () => {
    set({
      messages: [],
      currentSessionId: null,
      chatError: null,
      progressSteps: [],
    });
  },

  switchSession: async (id: string) => {
    set({ currentSessionId: id, messages: [], chatError: null });
    await get().loadSessionMessages(id);
  },

  sendMessage: async (message: string, skill?: string) => {
    const { currentSessionId, messages } = get();

    // Add optimistic user message
    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: message,
      skillName: skill,
      createdAt: new Date().toISOString(),
    };

    set({
      messages: [...messages, userMsg],
      isLoading: true,
      chatError: null,
      progressSteps: [
        { type: 'thinking', message: '正在分析您的问题...', step: 1 },
      ],
    });

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          sessionId: currentSessionId,
          skill,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '发送失败');
      }

      const data = await res.json();

      // Update current session id if it was a new session
      if (data.sessionId && !currentSessionId) {
        set({ currentSessionId: data.sessionId });
      }

      const assistantMsg: ChatMessage = {
        id: data.messageId || generateId(),
        role: 'assistant',
        content: data.content || '',
        skillName: data.skillName || skill,
        thinkingSteps: data.thinkingSteps || [],
        createdAt: data.createdAt || new Date().toISOString(),
      };

      set((state) => ({
        messages: [...state.messages, assistantMsg],
        isLoading: false,
        progressSteps: [],
      }));

      // Reload sessions to update sidebar
      get().loadSessions();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '发送失败';
      set((state) => ({
        isLoading: false,
        chatError: msg,
        progressSteps: [],
      }));
    }
  },

  deleteSession: async (id: string) => {
    try {
      const res = await fetch(`/api/chat/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('删除失败');

      const { currentSessionId } = get();
      if (currentSessionId === id) {
        set({ currentSessionId: null, messages: [] });
      }
      await get().loadSessions();
    } catch {
      // silent fail
    }
  },

  loadSessionMessages: async (sessionId: string) => {
    try {
      const res = await fetch(`/api/chat/${sessionId}/messages`);
      if (!res.ok) throw new Error('Failed to load messages');
      const data = await res.json();
      const msgs: ChatMessage[] = data.map((m: Record<string, unknown>) => ({
        id: m.id as string,
        role: m.role as 'user' | 'assistant',
        content: m.content as string,
        skillName: (m.skillName as string) || undefined,
        thinkingSteps: m.thinkingSteps
          ? JSON.parse(m.thinkingSteps as string)
          : [],
        createdAt: m.createdAt as string,
      }));
      set({ messages: msgs });
    } catch {
      set({ messages: [] });
    }
  },
}));
