import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-nuevo-prospecto',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="prospecto-container">
      <h2>Nuevo Prospecto</h2>

      <div class="prospecto-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styleUrls: ['./nuevo-prospecto.component.scss']
})
export class NuevoProspectoComponent {

}
