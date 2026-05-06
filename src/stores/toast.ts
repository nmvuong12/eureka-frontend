import { defineStore } from 'pinia';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export const useToastStore = defineStore('toast', {
  state: () => ({
    toasts: [] as Toast[]
  }),
  actions: {
    show(message: string, type: Toast['type'] = 'info', duration = 3000) {
      const id = Date.now();
      this.toasts.push({ id, message, type, duration });
      
      if (duration > 0) {
        setTimeout(() => {
          this.remove(id);
        }, duration);
      }
    },
    success(message: string) { this.show(message, 'success'); },
    error(message: string) { this.show(message, 'error', 5000); },
    warning(message: string) { this.show(message, 'warning'); },
    info(message: string) { this.show(message, 'info'); },
    remove(id: number) {
      this.toasts = this.toasts.filter(t => t.id !== id);
    }
  }
});
