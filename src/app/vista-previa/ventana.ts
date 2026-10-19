import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { Icon, NombreIcono } from '../ui/icon/icon';

export type Ancho = 'movil' | 'tablet' | 'escritorio';

const ANCHOS: { id: Ancho; nombre: string; icono: NombreIcono; px: number | null }[] = [
  { id: 'movil', nombre: 'Móvil', icono: 'movil', px: 375 },
  { id: 'tablet', nombre: 'Tablet', icono: 'tablet', px: 768 },
  { id: 'escritorio', nombre: 'Escritorio', icono: 'escritorio', px: null },
];

// La página generada en un marco de navegador: barra con el nombre del proyecto y los anchos de
// móvil, tablet y escritorio. El iframe no tiene ningún permiso (sandbox="") y el documento ya
// viene saneado y con su CSP (vista-previa/sanear.ts, docs/vista-previa.md).
@Component({
  selector: 'ui-ventana',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './ventana.html',
  styleUrl: './ventana.css',
})
export class Ventana {
  readonly documento = input<string | null>(null);
  readonly nombre = input('Página sin nombre');
  readonly vacio = input('');
  readonly ancho = model<Ancho>('escritorio');

  protected readonly ANCHOS = ANCHOS;
  protected readonly anchoPx = computed(() => ANCHOS.find((a) => a.id === this.ancho())!.px);
}
