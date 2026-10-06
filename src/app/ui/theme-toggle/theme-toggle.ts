import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TemaService } from '../../core/tema.service';

// El sol se pone tras una duna y sale la luna con estrellas que titilan (o al revés).
@Component({
  selector: 'ui-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="tema"
      [class.tema--oscuro]="oscuro()"
      [attr.aria-label]="oscuro() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
      (click)="alternar($event)"
    >
      <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <g class="estrellas">
          <circle cx="7" cy="8" r="1" />
          <circle cx="25" cy="6" r="1.2" />
          <circle cx="21" cy="12" r="0.8" />
        </g>
        <g class="sol">
          <circle cx="16" cy="15" r="5.5" />
        </g>
        <g class="luna">
          <path d="M18.5 8.5a6.5 6.5 0 1 0 4 11.6A7.2 7.2 0 0 1 18.5 8.5Z" />
        </g>
        <path class="duna" d="M0 32V22c5-4 9-4.5 14-2.2s9 2.6 18-1.3V32Z" />
      </svg>
    </button>
  `,
  styleUrl: './theme-toggle.css',
})
export class ThemeToggle {
  private readonly temaService = inject(TemaService);
  protected readonly oscuro = computed(() => this.temaService.tema() === 'oscuro');

  protected alternar(evento: MouseEvent): void {
    const caja = (evento.currentTarget as HTMLElement).getBoundingClientRect();
    this.temaService.alternar({ x: caja.left + caja.width / 2, y: caja.top + caja.height / 2 });
  }
}
