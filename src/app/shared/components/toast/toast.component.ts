import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from './toast.service';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.activeToasts(); track toast.id) {
        <div 
          class="toast"
          [class]="toast.type"
          [@toastAnimation]
          (click)="removeToast(toast.id)"
        >
          <div class="toast-content">
            <span class="toast-message">{{ toast.message }}</span>
          </div>
          <button class="toast-close" (click)="removeToast(toast.id)">×</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 350px;
      width: 100%;
    }
    
    .toast {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      background-color: #333;
      color: white;
      animation: fadeIn 0.3s ease-in;
    }
    
    .toast-content {
      flex: 1;
    }
    
    .toast-message {
      font-size: 0.9rem;
    }
    
    .toast-close {
      background: none;
      border: none;
      color: white;
      font-size: 1.2rem;
      cursor: pointer;
      padding: 0 0 0 16px;
      margin: 0;
      opacity: 0.7;
      
      &:hover {
        opacity: 1;
      }
    }
    
    .success {
      background-color: #4caf50;
    }
    
    .error {
      background-color: #f44336;
    }
    
    .warning {
      background-color: #ff9800;
    }
    
    .info {
      background-color: #2196f3;
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `],
  animations: [
    trigger('toastAnimation', [
      state('void', style({
        opacity: 0,
        transform: 'translateY(-20px)'
      })),
      state('*', style({
        opacity: 1,
        transform: 'translateY(0)'
      })),
      transition('void => *', animate('300ms ease-out')),
      transition('* => void', animate('200ms ease-in'))
    ])
  ]
})
export class ToastComponent {
  toastService = inject(ToastService);
  
  removeToast(id: number): void {
    this.toastService.remove(id);
  }
}