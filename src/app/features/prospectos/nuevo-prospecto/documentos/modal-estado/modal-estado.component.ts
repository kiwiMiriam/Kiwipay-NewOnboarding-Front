import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentoLocal } from '../documentos.component';

@Component({
  selector: 'app-modal-estado',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./modal-estado.component.scss'],
  templateUrl: './modal-estado.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalEstadoComponent implements OnChanges {
  @Input() mostrarModal = false;
  @Input() documento: DocumentoLocal | null = null;
  @Output() cerrar = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<{
    estadoAprobacion: 'sin-estado' | 'aprobado' | 'rechazado',
    comentario: string
  }>();

  estadoAprobacionTemp: 'sin-estado' | 'aprobado' | 'rechazado' = 'sin-estado';
  comentarioAprobacionTemp = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['documento'] && this.documento) {
      this.estadoAprobacionTemp = this.documento.estadoAprobacion;
      this.comentarioAprobacionTemp = this.documento.comentario || '';
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
