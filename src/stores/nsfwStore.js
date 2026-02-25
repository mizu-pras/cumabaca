import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useNsfwStore = create(
  persist(
    (set) => ({
      nsfwEnabled: false,
      toggle: () => set((state) => ({ nsfwEnabled: !state.nsfwEnabled })),
      setEnabled: (enabled) => set({ nsfwEnabled: enabled }),
    }),
    {
      name: 'cumabaca-nsfw',
      migrate: (state) => {
        // Migrate from old 'secretMode' to 'nsfwEnabled'
        if (state.secretMode !== undefined) {
          return { nsfwEnabled: state.secretMode };
        }
        return state;
      },
    }
  )
);
