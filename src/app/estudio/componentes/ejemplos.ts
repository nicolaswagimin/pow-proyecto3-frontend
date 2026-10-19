import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

// Estado vacío útil: frases de ejemplo que se prueban con un clic (se envían como una orden).
@Component({
  selector: 'ui-ejemplos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 class="titulo">Prueba con una de estas</h2>
    <ul class="lista">
      @for (frase of frases(); track frase) {
        <li>
          <button type="button" class="ejemplo" (click)="elegir.emit(frase)">«{{ frase }}»</button>
        </li>
      }
    </ul>
  `,
  styles: `
    :host {
      display: grid;
      gap: var(--space-3);
      width: 100%;
    }
    .titulo {
      font-size: var(--text-sm);
      font-weight: var(--peso-fuerte);
      color: var(--color-texto-suave);
      text-align: center;
    }
    .lista {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
      gap: var(--space-3);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .ejemplo {
      width: 100%;
      height: 100%;
      min-height: 44px;
      padding: var(--space-3) var(--space-4);
      border: 0;
      border-radius: var(--radius-control);
      background: var(--color-fondo);
      box-shadow: inset 0 0 0 1px var(--color-borde);
      color: var(--color-texto);
      font-family: var(--font-voz);
      font-size: var(--text-lg);
      line-height: 1.3;
      text-align: left;
      cursor: pointer;
    }
    .ejemplo:focus-visible {
      outline: 2px solid var(--color-foco);
      outline-offset: 2px;
    }
    @media (hover: hover) {
      .ejemplo:hover {
        box-shadow: inset 0 0 0 2px var(--color-primario);
      }
    }
  `,
})
export class Ejemplos {
  readonly frases = input<string[]>([]);
  readonly elegir = output<string>();
}
