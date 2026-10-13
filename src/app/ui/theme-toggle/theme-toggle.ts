import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TemaService } from '../../core/tema.service';

// Un fader de la consola del estudio: arriba, luz encendida (modo claro); abajo, cabina a oscuras.
@Component({
  selector: 'ui-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="tema"
      [class.tema--oscuro]="oscuro()"
      [attr.aria-label]="oscuro() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
      (click)="alternar()"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path class="pista" d="M12 3v18" />
        <path class="marcas" d="M7 5h2M7 9h2M7 13h2M7 17h2M15 5h2M15 9h2M15 13h2M15 17h2" />
        <rect class="perilla" x="8" y="4" width="8" height="5" rx="1.5" />
      </svg>
    </button>
  `,
  styleUrl: './theme-toggle.css',
})
export class ThemeToggle {
  private readonly temaService = inject(TemaService);
  protected readonly oscuro = computed(() => this.temaService.tema() === 'oscuro');

  protected alternar(): void {
    this.temaService.alternar();
  }
}
