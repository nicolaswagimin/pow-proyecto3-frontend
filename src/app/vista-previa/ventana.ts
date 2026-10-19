import { ChangeDetectionStrategy, Component, computed, inject, input, model } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
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
  // Un documento ya preparado con documentoVistaPrevia() (saneado y con su CSP).
  readonly documento = input<string | null>(null);
  readonly nombre = input('Página sin nombre');
  readonly vacio = input('');
  readonly ancho = model<Ancho>('escritorio');

  protected readonly ANCHOS = ANCHOS;
  private readonly dom = inject(DomSanitizer);
  // Angular sanea srcdoc por su cuenta y le quitaría el <head>, los <style> y los data-vtw: la
  // página llegaría sin estilos. El documento ya pasó por nuestro saneador (vista-previa/sanear.ts)
  // y el iframe no tiene ningún permiso, así que se entrega tal cual (docs/vista-previa.md).
  protected readonly srcdoc = computed(() => {
    const doc = this.documento();
    return doc ? this.dom.bypassSecurityTrustHtml(doc) : null;
  });
  protected readonly anchoPx = computed(() => ANCHOS.find((a) => a.id === this.ancho())!.px);
}
