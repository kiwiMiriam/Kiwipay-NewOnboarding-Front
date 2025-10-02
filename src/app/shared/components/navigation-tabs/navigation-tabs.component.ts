import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
            <li [class.active]="tab.active">
              <a [routerLink]="tab.path" routerLinkActive #rla="routerLinkActive"
                 (click)="setActiveTab(tab.id)">
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
export class NavigationTabsComponent {
  @Input() title: string = '';
  @Input() tabs: Array<{id: string, label: string, path: string, active: boolean}> = [];
  
  setActiveTab(tabId: string): void {
    this.tabs.forEach(tab => {
      tab.active = tab.id === tabId;
    });
  }
}