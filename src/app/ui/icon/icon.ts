import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type NombreIcono =
  | 'correo'
  | 'candado'
  | 'usuario'
  | 'alerta'
  | 'check'
  | 'info'
  | 'salir'
  | 'chispa'
  | 'papelera'
  | 'recargar'
  | 'mas'
  | 'mayus'
  | 'microfono'
  | 'descargar'
  | 'copiar'
  | 'deshacer'
  | 'rehacer'
  | 'movil'
  | 'tablet'
  | 'escritorio'
  | 'carpeta'
  | 'teclado';

// Íconos propios en línea, trazo de 1.8 px y extremos redondeados. Siempre decorativos:
// el texto accesible lo pone el elemento que los contiene.
@Component({
  selector: 'ui-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      @switch (nombre()) {
        @case ('correo') {
          <svg:rect x="3" y="5" width="18" height="14" rx="3" />
          <svg:path d="m4 7 8 6 8-6" />
        }
        @case ('candado') {
          <svg:rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
          <svg:path class="arco" d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
          <svg:path d="M12 14.5v2.5" />
        }
        @case ('usuario') {
          <svg:circle cx="12" cy="8" r="3.8" />
          <svg:path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
        }
        @case ('alerta') {
          <svg:circle cx="12" cy="12" r="9" />
          <svg:path d="M12 7.5v5.5M12 16.4v.1" />
        }
        @case ('check') {
          <svg:path d="m5 12.5 4.5 4.5L19 7.5" />
        }
        @case ('info') {
          <svg:circle cx="12" cy="12" r="9" />
          <svg:path d="M12 11v5.5M12 7.6v.1" />
        }
        @case ('salir') {
          <svg:path d="M14 4h3.5A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5H14" />
          <svg:path d="M10 8l-4 4 4 4M6 12h9" />
        }
        @case ('chispa') {
          <svg:path
            d="M12 3c.6 4.4 2.6 6.4 7 7-4.4.6-6.4 2.6-7 7-.6-4.4-2.6-6.4-7-7 4.4-.6 6.4-2.6 7-7Z"
          />
          <svg:path
            d="M19 16.5c.2 1.4.9 2.1 2.3 2.3-1.4.2-2.1.9-2.3 2.3-.2-1.4-.9-2.1-2.3-2.3 1.4-.2 2.1-.9 2.3-2.3Z"
          />
        }
        @case ('papelera') {
          <svg:path
            d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l.9 12.2a1.8 1.8 0 0 0 1.8 1.8h5.6a1.8 1.8 0 0 0 1.8-1.8L17.5 7"
          />
        }
        @case ('recargar') {
          <svg:path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4" />
        }
        @case ('mas') {
          <svg:path d="M12 5v14M5 12h14" />
        }
        @case ('microfono') {
          <svg:rect x="9" y="3" width="6" height="11" rx="3" />
          <svg:path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" />
        }
        @case ('descargar') {
          <svg:path d="M12 4v11M7.5 10.5 12 15l4.5-4.5" />
          <svg:path d="M5 19.5h14" />
        }
        @case ('copiar') {
          <svg:rect x="8.5" y="8.5" width="11" height="11" rx="2.5" />
          <svg:path d="M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5" />
        }
        @case ('deshacer') {
          <svg:path d="M8.5 6 4.5 10l4 4" />
          <svg:path d="M4.5 10h10a5 5 0 0 1 0 10H11" />
        }
        @case ('rehacer') {
          <svg:path d="m15.5 6 4 4-4 4" />
          <svg:path d="M19.5 10h-10a5 5 0 0 0 0 10H13" />
        }
        @case ('movil') {
          <svg:rect x="7" y="3" width="10" height="18" rx="2.5" />
          <svg:path d="M11 17.5h2" />
        }
        @case ('tablet') {
          <svg:rect x="4.5" y="3" width="15" height="18" rx="2.5" />
          <svg:path d="M11 17.5h2" />
        }
        @case ('escritorio') {
          <svg:rect x="3" y="4.5" width="18" height="12" rx="2" />
          <svg:path d="M9 20h6M12 16.5V20" />
        }
        @case ('carpeta') {
          <svg:path
            d="M3.5 7.5A2 2 0 0 1 5.5 5.5h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z"
          />
        }
        @case ('teclado') {
          <svg:rect x="3" y="6.5" width="18" height="11" rx="2" />
          <svg:path d="M7 10h.1M10.5 10h.1M14 10h.1M17 10h.1M8 14h8" />
        }
        @case ('mayus') {
          <svg:path d="M12 4 4.5 12H8.5v4.5h7V12h4L12 4Z" />
          <svg:path d="M8.5 20h7" />
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-grid;
      width: var(--icono-tamano, 1.25em);
      height: var(--icono-tamano, 1.25em);
      flex-shrink: 0;
    }
    svg {
      width: 100%;
      height: 100%;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
      overflow: visible;
    }
  `,
})
export class Icon {
  readonly nombre = input.required<NombreIcono>();
}
