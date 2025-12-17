import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Document } from '../../../../../core/models/document.model';

@Component({
  selector: 'app-modal-accion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './modal-accion.component.html',
  styleUrls: ['./modal-accion.component.scss']
})
export class ModalAccionComponent implements OnChanges {
  @Input() mostrarModal = false;
  @Input() documento: Document | null = null;
  @Input() accion: 'aprobar' | 'rechazar' = 'aprobar';
  @Output() cerrar = new EventEmitter<void>();
  @Output() confirmar = new EventEmitter<string>();

  comentario = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['documento'] && this.documento) {
      this.comentario = this.documento.comment || '';
    }
    if (changes['mostrarModal'] && !this.mostrarModal) {
      this.comentario = '';
    }
  }

  cerrarModal(): void {
    this.comentario = '';
    this.cerrar.emit();
  }

  confirmarAccion(): void {
    this.confirmar.emit(this.comentario);
    this.comentario = '';
  }

  get tituloModal(): string {
    return this.accion === 'aprobar' ? 'Aprobar Documento' : 'Rechazar Documento';
  }

  get colorBoton(): string {
    return this.accion === 'aprobar' ? 'btn-success' : 'btn-danger';
  }
}