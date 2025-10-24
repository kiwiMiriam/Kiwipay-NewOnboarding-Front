import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private sidebarState = new BehaviorSubject<boolean>(false);
  sidebarCollapsed$ = this.sidebarState.asObservable();

  toggleSidebar() {
    this.sidebarState.next(!this.sidebarState.value);
  }

  setSidebarState(collapsed: boolean) {
    this.sidebarState.next(collapsed);
  }

  get isCollapsed() {
    return this.sidebarState.value;
  }
}
