import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject, Observable, filter } from 'rxjs';

/**
 * Service for managing navigation between tabs and keeping track of active tabs
 */
@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  // Define the tab mapping between IDs and routes
  private tabRouteMap: Record<string, string> = {
    'cliente': '/dashboard/datos-clientes',
    'clinica': '/dashboard/datos-clinicas',
    'cotizador': '/dashboard/cotizador',
    'documento': '/dashboard/documentos'
  };

  // Subject to track the currently active tab
  private activeTabSubject = new BehaviorSubject<string>('cliente');

  constructor(private router: Router) {
    // Subscribe to router events to update the active tab based on URL
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateActiveTabFromUrl(event.url);
    });

    // Set initial active tab based on current URL
    this.updateActiveTabFromUrl(this.router.url);
  }

  /**
   * Get the currently active tab as an observable
   */
  get activeTab$(): Observable<string> {
    return this.activeTabSubject.asObservable();
  }

  /**
   * Get the currently active tab ID
   */
  get activeTabId(): string {
    return this.activeTabSubject.value;
  }

  /**
   * Navigate to a specific tab by its ID
   */
  navigateToTab(tabId: string): void {
    const route = this.tabRouteMap[tabId];
    if (route) {
      this.router.navigate([route]);
      this.activeTabSubject.next(tabId);
    }
  }

  /**
   * Navigate to the next tab in the sequence
   */
  navigateNext(currentTabId: string): void {
    const tabOrder = ['cliente', 'clinica', 'cotizador', 'documento'];
    const currentIndex = tabOrder.indexOf(currentTabId);

    if (currentIndex !== -1 && currentIndex < tabOrder.length - 1) {
      const nextTabId = tabOrder[currentIndex + 1];
      this.navigateToTab(nextTabId);
    } else {
      // Wrap around to the first tab if at the end
      this.navigateToTab(tabOrder[0]);
    }
  }

  /**
   * Navigate to the previous tab in the sequence
   */
  navigateBack(currentTabId: string): void {
    const tabOrder = ['cliente', 'clinica', 'cotizador', 'documento'];
    const currentIndex = tabOrder.indexOf(currentTabId);

    if (currentIndex !== -1 && currentIndex > 0) {
      const prevTabId = tabOrder[currentIndex - 1];
      this.navigateToTab(prevTabId);
    } else {
      // Wrap around to the last tab if at the beginning
      this.navigateToTab(tabOrder[tabOrder.length - 1]);
    }
  }

  /**
   * Update the active tab based on the current URL
   */
  private updateActiveTabFromUrl(url: string): void {
    // Check URL against each route to find the matching tab
    Object.entries(this.tabRouteMap).forEach(([tabId, route]) => {
      if (url.includes(route)) {
        this.activeTabSubject.next(tabId);
      }
    });
  }
}
