import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarMenuComponent } from './shared/components/sidebar-menu/sidebar-menu.component';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarMenuComponent, ToastComponent],
  template: `
    <div class="app-container">
      <app-sidebar-menu></app-sidebar-menu>
      <div class="main-content">
        <router-outlet></router-outlet>
      </div>
    </div>
    <app-toast></app-toast>
  `,
  styles: [`
    .app-container {
      display: flex;
      min-height: 100vh;
    }

    .main-content {
      flex: 1;
      margin-left: 250px; // Match sidebar width
      padding: 1rem;
      background-color: #f8f9fa;
    }
  `]
})
export class AppComponent {}
