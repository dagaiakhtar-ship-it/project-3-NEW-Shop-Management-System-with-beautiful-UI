import { create } from 'zustand';

/**
 * Zustand Loading Store
 * Manages global and component-level loading states. This allows overlay indicators,
 * progress bars, or individual operation status screens to be easily tracked.
 */
export const useLoadingStore = create((set) => ({
  isLoading: false,
  loadingMessage: '',
  activeTasks: {}, // Track multiple concurrent tasks by name

  startLoading: (message = 'Processing...') => set({ isLoading: true, loadingMessage: message }),
  
  stopLoading: () => set({ isLoading: false, loadingMessage: '' }),

  setTaskLoading: (taskName, isLoading) =>
    set((state) => ({
      activeTasks: {
        ...state.activeTasks,
        [taskName]: isLoading,
      },
    })),

  isTaskLoading: (taskName) => (state) => !!state.activeTasks[taskName],
}));

export default useLoadingStore;
