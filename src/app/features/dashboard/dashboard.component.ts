import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

// Components
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarMenuComponent } from '../../shared/components/sidebar-menu/sidebar-menu.component';
import { NavigationTabsComponent } from '../../shared/components/navigation-tabs/navigation-tabs.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    SidebarMenuComponent,
    NavigationTabsComponent
  ],
  template: `
    <div class="dashboard-container">
      <app-sidebar-menu></app-sidebar-menu>
      <div class="main-content">
        <app-header></app-header>
        <main>
          <div class="content-container">
            <app-navigation-tabs
              *ngIf="showNavigationTabs"
              [title]="'Nuevo Prospecto'"
              [tabs]="navigationTabs">
            </app-navigation-tabs>
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </div>
  `,
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  showNavigationTabs = false;
  navigationTabs = [
    { id: 'cliente', label: 'Datos clientes', path: '/dashboard/nuevo-prospecto/datos-cliente', active: true },
    { id: 'clinica', label: 'Datos clinicas', path: '/dashboard/nuevo-prospecto/datos-clinica', active: false },
    { id: 'cotizador', label: 'Cotizador', path: '/dashboard/nuevo-prospecto/cotizador', active: false },
    { id: 'documento', label: 'Documentos', path: '/dashboard/nuevo-prospecto/documentos', active: false },
  ];

  private routerSubscription: Subscription | undefined;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Subscribe to router events to determine when to show navigation tabs
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        // Show tabs only when we're in the nuevo-prospecto flow
        this.showNavigationTabs = event.url.includes('/nuevo-prospecto');

        // Update active tab
        if (this.showNavigationTabs) {
          const currentPath = event.url;
          this.navigationTabs.forEach(tab => {
            tab.active = currentPath.includes(tab.path);
          });
        }
      });

    // Handle initial route
    this.showNavigationTabs = this.router.url.includes('/nuevo-prospecto');

    // If we're at the root dashboard path, redirect to bandeja
    if (this.router.url === '/dashboard') {
      this.router.navigate(['/dashboard/bandeja']);
    }
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}
