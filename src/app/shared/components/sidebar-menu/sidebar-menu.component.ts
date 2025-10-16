import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faInbox, faBars } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-sidebar-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  template: `
    <aside class="sidebar" [class.collapsed]="isCollapsed">
      <div class="sidebar-header">
        <img src="images/kiwiTextGreenLightIcon.svg" alt="KiwiPlan Logo" class="logo" *ngIf="!isCollapsed">
        <button class="toggle-btn" (click)="toggleSidebar()">
          <fa-icon [icon]="faBars"></fa-icon>
        </button>
      </div>

      <nav class="sidebar-nav">
        <ul>
          <li>
            <a routerLink="/dashboard/bandeja" routerLinkActive="active">
              <fa-icon [icon]="faInbox"></fa-icon>
              <span *ngIf="!isCollapsed">BANDEJA</span>
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  `,
  styleUrls: ['./sidebar-menu.component.scss']
})
export class SidebarMenuComponent {
  isCollapsed = false;
  faInbox = faInbox;
  faBars = faBars;

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }
}
