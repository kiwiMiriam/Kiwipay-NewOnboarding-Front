import { Component, Input, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navigation-tabs',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navigation-tabs">
      <div class="nav-title">{{ title }}</div>
      <div class="tabs-container">
        <ul class="tabs-list">
          @for (tab of tabs; track tab.path) {
            <li [class.active]="tab.active" 
                [class.disabled]="!canAccessTab(tab.id)"
                [class.enabled]="canAccessTab(tab.id)">
              <a [routerLink]="canAccessTab(tab.id) ? tab.path : null" 
                 [queryParamsHandling]="'preserve'"
                 routerLinkActive #rla="routerLinkActive"
                 (click)="onTabClick(tab)"
                 [style.pointer-events]="canAccessTab(tab.id) ? 'auto' : 'none'"
                 [style.cursor]="canAccessTab(tab.id) ? 'pointer' : 'default'">
                {{ tab.label }}
              </a>
            </li>
          }
        </ul>
        <div class="tab-indicator"></div>
      </div>
    </nav>
  `,
  styleUrls: ['./navigation-tabs.component.scss']
})
export class NavigationTabsComponent implements OnInit, OnDestroy {
  @Input() title: string = '';
  @Input() tabs: Array<{id: string, label: string, path: string, active: boolean}> = [];

  private updateTabListener: (event: Event) => void;
  private routerSubscription: Subscription | undefined;

  constructor(
    private elementRef: ElementRef,
    private router: Router,
    public authService: AuthService
  ) {
    // Define the event listener function
    this.updateTabListener = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.tabId) {
        this.setActiveTab(customEvent.detail.tabId);
      }
    };
  }

  /**
   * Verificar si el usuario puede acceder a una pestaña específica
   */
  canAccessTab(tabId: string): boolean {
    // Mapeo de IDs de pestañas a secciones de permisos
    const sectionMap: {[key: string]: string} = {
      'cliente': 'CLIENTES',
      'clinica': 'CLINICAS', 
      'cotizador': 'COTIZADOR',
      'documento': 'DOCUMENTOS',
      'prospecto': 'PROSPECTO'
    };

    const section = sectionMap[tabId];
    return section ? this.authService.canAccessSection(section) : false;
  }

  /**
   * Manejar click en pestaña con verificación de permisos
   */
  onTabClick(tab: any): void {
    if (this.canAccessTab(tab.id)) {
      this.setActiveTab(tab.id);
    } else {
      // Prevenir navegación si no tiene permisos
      event?.preventDefault();
    }
  }

  ngOnInit(): void {
    // Add event listener to the component element
    this.elementRef.nativeElement.addEventListener(
      'update-active-tab',
      this.updateTabListener
    );

    // Subscribe to router events to update the active tab based on the current route
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateActiveTabFromUrl(event.url);
    });

    // Set initial active tab based on the current URL
    this.updateActiveTabFromUrl(this.router.url);
  }

  ngOnDestroy(): void {
    // Clean up event listener when component is destroyed
    this.elementRef.nativeElement.removeEventListener(
      'update-active-tab',
      this.updateTabListener
    );

    // Clean up router subscription
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  setActiveTab(tabId: string): void {
    this.tabs.forEach(tab => {
      tab.active = tab.id === tabId;
    });
  }

  private updateActiveTabFromUrl(url: string): void {
    // Find the tab that matches the current URL
    const matchedTab = this.tabs.find(tab => url.includes(tab.path));
    if (matchedTab) {
      this.setActiveTab(matchedTab.id);
    }
  }
}
