import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Document } from '../../../../../core/models/document.model';

@Component({
  selector: 'app-modal-estado',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './modal-estado.component.html',
  styleUrls: ['./modal-estado.component.scss']
})
export class ModalEstadoComponent implements OnChanges {
  @Input() mostrarModal = false;
  @Input() documento: Document | null = null;
  @Output() cerrar = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<{
    estadoAprobacion: 'sin-estado' | 'aprobado' | 'rechazado',
    comentario: string
  }>();

  estadoAprobacionTemp: 'sin-estado' | 'aprobado' | 'rechazado' = 'sin-estado';
  comentarioAprobacionTemp = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['documento'] && this.documento) {
      // Mapear el estado del documento del backend al estado del modal
      const reviewStatus = this.documento.reviewStatus?.toUpperCase();
      this.estadoAprobacionTemp = reviewStatus === 'APPROVED' ? 'aprobado' : 
                                 reviewStatus === 'REJECTED' ? 'rechazado' : 'sin-estado';
      this.comentarioAprobacionTemp = this.documento.comment || '';
    }
  }

  cerrarModalEstado(): void {
    this.estadoAprobacionTemp = 'sin-estado';
    this.comentarioAprobacionTemp = '';
    this.cerrar.emit();
  }

  guardarEstadoDocumento(): void {
    this.guardar.emit({
      estadoAprobacion: this.estadoAprobacionTemp,
      comentario: this.comentarioAprobacionTemp
    });
  }
}
