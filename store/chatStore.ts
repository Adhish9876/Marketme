import { create } from 'zustand';

interface ChatStore {
  messages: any[];
  addMessage: (message: any) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
}));