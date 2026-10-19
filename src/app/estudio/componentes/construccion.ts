import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Progreso } from '../estudio-estado';

// El progreso visible mientras la IA trabaja: qué está pasando, los bloques que ya llegaron (en
// orden, como aparecen en la ventana) y cuánto va. Solo se anuncia el texto de estado.
@Component({
  selector: 'ui-construccion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (orden()) {
      <p class="orden">«{{ orden() }}»</p>
    }
    <p class="estado" role="status">{{ progreso().texto }}</p>
    @if (progreso().bloques.length) {
      <ol class="bloques" aria-label="Partes listas">
        @for (b of progreso().bloques; track b.id) {
          <li>{{ b.nombre }}</li>
        }
      </ol>
    }
    <p class="detalle">
      @if (progreso().caracteres) {
        <span class="cifra">{{ caracteres() }} caracteres</span>
      }
      @if (progreso().sinStream) {
        <span>La conexión no deja ver la página en vivo: llega completa (sin vista en vivo).</span>
      }
      @if (progreso().desdeCache) {
        <span>Ya la habías pedido: viene de la caché, sin gastar IA.</span>
      }
    </p>
  `,
  styles: `
    :host {
      display: grid;
      gap: var(--space-2);
      padding: var(--space-4);
      border-radius: var(--radius-panel);
      background: var(--color-superficie);
      box-shadow: var(--shadow-elevacion-2);
    }
    .orden {
      font-family: var(--font-voz);
      font-size: var(--text-lg);
    }
    .estado {
      font-weight: var(--peso-fuerte);
    }
    .bloques {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .bloques li {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      padding: 2px var(--space-3);
      border-radius: var(--radius-pill);
      background: var(--color-fondo);
      font-size: var(--text-sm);
    }
    .bloques li::before {
      content: '✓';
      color: var(--color-exito);
      font-weight: var(--peso-fuerte);
    }
    .detalle {
      display: grid;
      gap: var(--space-1);
      font-size: var(--text-sm);
      color: var(--color-texto-suave);
    }
    .detalle:empty {
      display: none;
    }
  `,
})
export class Construccion {
  readonly progreso = input.required<Progreso>();
  readonly orden = input('');

  private static readonly formato = new Intl.NumberFormat('es-CO');
  protected readonly caracteres = computed(() =>
    Construccion.formato.format(this.progreso().caracteres),
  );
}
