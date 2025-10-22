import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faInbox } from '@fortawesome/free-solid-svg-icons';
import { HeaderComponent } from '../header/header.component';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  template: `
    <aside class="sidebar" [class.collapsed]="isCollapsed">
      <nav class="sidebar-nav">
        <ul>
          <li>
            <a routerLink="/dashboard/bandeja" routerLinkActive="active" (click)="onNavigate()">
              <fa-icon [icon]="faInbox"></fa-icon>
              @if (!isCollapsed) {
                <span>BANDEJA</span>
              }
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  `,
  styleUrls: ['./sidebar-menu.component.scss']
})
export class SidebarMenuComponent implements OnInit, OnDestroy {
  isCollapsed = false;
  faInbox = faInbox;
  private subscriptions: Subscription[] = [];

  constructor(private router: Router) {}

  ngOnInit() {
    // Subscribe to sidebar state changes
    this.subscriptions.push(
      HeaderComponent.sidebarCollapsed$.subscribe(
        collapsed => this.isCollapsed = collapsed
      )
    );

    // Auto-collapse on navigation for mobile
    this.subscriptions.push(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => {
        if (window.innerWidth < 768) {
          HeaderComponent.sidebarState.next(true);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onNavigate() {
    if (window.innerWidth < 768) {
      HeaderComponent.sidebarState.next(true);
    }
  }
}
