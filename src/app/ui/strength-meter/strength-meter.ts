import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ETIQUETAS_FUERZA, calcularFuerza, pistaFuerza } from '../../core/fuerza';

// Ángulo del sol sobre el arco del horizonte según el nivel (0 = en el horizonte, 90 = cénit).
const ANGULOS = [0, 22, 45, 68, 90];

// Medidor de fortaleza: un sol que sube por el arco del horizonte mientras el cielo pasa de
// ciruela (débil) a dorado (fuerte).
@Component({
  selector: 'ui-strength-meter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg class="horizonte" viewBox="0 0 100 56" aria-hidden="true" focusable="false">
      <path class="cielo cielo--noche" d="M8 50 A42 42 0 0 1 92 50 Z" />
      <path class="cielo cielo--dia" d="M8 50 A42 42 0 0 1 92 50 Z" [style.opacity]="nivel() / 4" />
      <path class="arco" d="M8 50 A42 42 0 0 1 92 50" />
      <g class="sol" [style.rotate.deg]="angulo()">
        <circle cx="8" cy="50" r="7" />
      </g>
      <path class="suelo" d="M2 50 H98" />
    </svg>
    <p class="texto" aria-live="polite">
      @if (nivel() > 0) {
        <strong>Fortaleza: {{ etiqueta() }}.</strong> {{ pista() }}
      }
    </p>
  `,
  styleUrl: './strength-meter.css',
})
export class StrengthMeter {
  readonly password = input('');

  protected readonly nivel = computed(() => calcularFuerza(this.password()));
  protected readonly angulo = computed(() => ANGULOS[this.nivel()]);
  protected readonly etiqueta = computed(() => ETIQUETAS_FUERZA[this.nivel()]);
  protected readonly pista = computed(() => pistaFuerza(this.password(), this.nivel()));
}
