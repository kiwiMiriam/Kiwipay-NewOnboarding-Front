import { Component, OnDestroy, OnInit, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faInbox } from '@fortawesome/free-solid-svg-icons';
import { filter, Subscription } from 'rxjs';
import { SidebarService } from '../../services/sidebar.service';

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

  constructor(
    private router: Router,
    private sidebarService: SidebarService,
    private elementRef: ElementRef
  ) {
    // Inicializamos el estado del sidebar
    this.isCollapsed = this.sidebarService.isCollapsed;
  }

  @HostListener('document:click', ['$event'])
  handleClick(event: MouseEvent) {
    const targetElement = event.target as HTMLElement;
    const isToggleButton = targetElement.closest('.toggle-btn');
    const isSidebarClick = this.elementRef.nativeElement.contains(targetElement);

    // Si el clic no fue en el botón de toggle ni en el sidebar
    // y el sidebar está expandido, entonces lo contraemos
    if (!isToggleButton && !isSidebarClick && !this.isCollapsed) {
      this.sidebarService.setSidebarState(true);
    }
  }

  ngOnInit() {
    // Subscribe to sidebar state changes
    this.subscriptions.push(
      this.sidebarService.sidebarCollapsed$.subscribe(
        collapsed => this.isCollapsed = collapsed
      )
    );

    // Auto-collapse on navigation for mobile
    this.subscriptions.push(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => {
        if (window.innerWidth < 768) {
          this.sidebarService.setSidebarState(true);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onNavigate() {
    if (window.innerWidth < 768) {
      this.sidebarService.setSidebarState(true);
    }
  }
}
