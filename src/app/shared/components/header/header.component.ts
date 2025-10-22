import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { faBars, faCircleUser, faSignOut } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <header class="app-header">
      <div class="header-left">
        <button class="toggle-btn" (click)="toggleSidebar()">
          <fa-icon [icon]="faBars"></fa-icon>
        </button>
        <img src="images/kiwiTextGreenLightIcon.svg" alt="KiwiPlan Logo" class="logo">
      </div>
      <div class="user-info" [class.show-dropdown]="isUserMenuOpen">
        @if (authService.user()) {
          <span class="user-name">{{ authService.user()?.fullName }}</span>
        }
        <button class="user-button" (click)="toggleUserMenu()" (blur)="onButtonBlur()">
          <fa-icon [icon]="faCircleUser"></fa-icon>
        </button>
        <div class="user-dropdown">
          <button class="dropdown-item" (click)="logout()">
            <fa-icon [icon]="faSignOut"></fa-icon>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </header>
  `,
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  public static sidebarState = new BehaviorSubject<boolean>(false);

  constructor(public authService: AuthService) {}

  // Font Awesome icons
  faBars = faBars;
  faCircleUser = faCircleUser;
  faSignOut = faSignOut;

  // Estado del menú de usuario
  isUserMenuOpen = false;
  private closeTimeout: any;

  static get sidebarCollapsed$() {
    return this.sidebarState.asObservable();
  }

  toggleSidebar() {
    HeaderComponent.sidebarState.next(!HeaderComponent.sidebarState.value);
  }

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
    }
  }

  onButtonBlur() {
    // Pequeño retraso para permitir que el click en el menú se registre
    this.closeTimeout = setTimeout(() => {
      this.isUserMenuOpen = false;
    }, 200);
  }

  logout(): void {
    this.isUserMenuOpen = false;
    this.authService.logout();
  }
}
