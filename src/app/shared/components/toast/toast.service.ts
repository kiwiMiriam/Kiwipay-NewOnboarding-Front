import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  // Use signal for reactive state management
  private toasts = signal<Toast[]>([]);
  
  // Public read-only signal
  public activeToasts = this.toasts;
  private counter = 0;

  constructor() {}

  /**
   * Shows a toast notification
   * @param message The message to display
   * @param type The type of toast (success, error, info, warning)
   * @param duration Time in milliseconds to show the toast (default: 3000ms)
   */
  show(message: string, type: ToastType = 'info', duration: number = 3000): void {
    const id = ++this.counter;
    
    // Add new toast to the list
    this.toasts.update(toasts => [
      ...toasts,
      { id, message, type, duration }
    ]);
    
    // Auto-remove toast after duration
    setTimeout(() => {
      this.remove(id);
    }, duration);
  }
  
  success(message: string, duration: number = 3000): void {
    this.show(message, 'success', duration);
  }
  
  error(message: string, duration: number = 5000): void {
    this.show(message, 'error', duration);
  }
  
  info(message: string, duration: number = 3000): void {
    this.show(message, 'info', duration);
  }
  
  warning(message: string, duration: number = 4000): void {
    this.show(message, 'warning', duration);
  }
  
  remove(id: number): void {
    this.toasts.update(toasts => toasts.filter(toast => toast.id !== id));
  }
  
  clear(): void {
    this.toasts.set([]);
  }
}