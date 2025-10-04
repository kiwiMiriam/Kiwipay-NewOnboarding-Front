import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { NavigationTabsComponent } from '../../shared/components/navigation-tabs/navigation-tabs.component';
import { NavigationService } from '../../core/services/navigation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, NavigationTabsComponent],
  template: `
    <div class="dashboard-container">
      <app-header></app-header>
      <main>
        <div class="dashboard-content">
          <app-navigation-tabs
            [title]="'Nuevo Prospecto'"
            [tabs]="navigationTabs">
          </app-navigation-tabs>

          <div class="content-container">
            <router-outlet></router-outlet>
          </div>
        </div>
      </main>
    </div>
  `,
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  navigationTabs = [
    { id: 'cliente', label: 'Datos clientes', path: '/dashboard/datos-clientes', active: false },
    { id: 'clinica', label: 'Datos clinicas', path: '/dashboard/datos-clinicas', active: false },
    { id: 'cotizador', label: 'Cotizador', path: '/dashboard/cotizador', active: false },
    { id: 'documento', label: 'Documentos', path: '/dashboard/documentos', active: false },
  ];

  private activeTabSubscription: Subscription | undefined;

  constructor(
    private router: Router,
    private navigationService: NavigationService
  ) {}

  ngOnInit(): void {
    // Navigate to default tab if directly accessing dashboard
    if (this.router.url === '/dashboard') {
      this.router.navigate(['/dashboard/datos-clientes']);
    }

    // Subscribe to changes in the active tab from the navigation service
    this.activeTabSubscription = this.navigationService.activeTab$.subscribe(activeTabId => {
      this.updateActiveTab(activeTabId);
    });
  }

  ngOnDestroy(): void {
    // Clean up subscription when component is destroyed
    if (this.activeTabSubscription) {
      this.activeTabSubscription.unsubscribe();
    }
  }

  /**
   * Update the active tab in the navigation tabs array
   */
  private updateActiveTab(tabId: string): void {
    this.navigationTabs.forEach(tab => {
      tab.active = tab.id === tabId;
    });
  }
}
