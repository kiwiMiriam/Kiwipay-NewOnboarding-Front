import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { NavigationTabsComponent } from '../../shared/components/navigation-tabs/navigation-tabs.component';

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
export class DashboardComponent implements OnInit {
  navigationTabs = [
    { id: 'cliente', label: 'Datos clientes', path: '/dashboard/datos-clientes', active: true },
    { id: 'clinica', label: 'Datos clinicas', path: '/dashboard/datos-clinicas', active: false },
    { id: 'cotizador', label: 'Cotizador', path: '/dashboard/cotizador', active: false },
    { id: 'documento', label: 'Documentos', path: '/dashboard/documentos', active: false },
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Navigate to default tab if directly accessing dashboard
    if (this.router.url === '/dashboard') {
      this.router.navigate(['/dashboard/datos-clientes']);
    }
  }
}
