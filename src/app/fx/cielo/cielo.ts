import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  booleanAttribute,
  inject,
  input,
  signal,
} from '@angular/core';

// Cielo de atardecer: malla de degradados cálidos que se mueve como aire caliente, un sol que
// respira con rayos que giran y dunas que ondulan. En modo [ambiente] solo quedan los degradados
// (fondo suave para las pantallas de trabajo).
@Component({
  selector: 'fx-cielo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="blob blob--1"></span>
    <span class="blob blob--2"></span>
    <span class="blob blob--3"></span>
    <span class="blob blob--4"></span>

    @if (!ambiente()) {
      <span class="noche"></span>
      <div class="sol">
        <span class="sol__rayos"></span>
        <span class="sol__disco"></span>
      </div>
      <svg class="duna duna--3" viewBox="0 0 2880 200" preserveAspectRatio="none">
        <path
          d="M0 90 C240 60 480 40 720 70 S1200 120 1440 90 C1680 60 1920 40 2160 70 S2640 120 2880 90 V200 H0Z"
        />
      </svg>
      <svg class="duna duna--2" viewBox="0 0 2880 200" preserveAspectRatio="none">
        <path
          d="M0 120 C300 80 540 70 760 110 S1180 150 1440 120 C1740 80 1980 70 2200 110 S2620 150 2880 120 V200 H0Z"
        />
      </svg>
      <svg class="duna duna--1" viewBox="0 0 2880 200" preserveAspectRatio="none">
        <path
          d="M0 150 C200 120 420 110 640 140 S1140 175 1440 150 C1640 120 1860 110 2080 140 S2580 175 2880 150 V200 H0Z"
        />
      </svg>
    }
  `,
  styleUrl: './cielo.css',
  host: {
    'aria-hidden': 'true',
    '[class.ambiente]': 'ambiente()',
    '[class.pausado]': 'pausado()',
  },
})
export class Cielo {
  readonly ambiente = input(false, { transform: booleanAttribute });
  protected readonly pausado = signal(false);

  constructor() {
    // Pestaña oculta: todas las animaciones del cielo se pausan.
    const alCambiarVisibilidad = () => this.pausado.set(document.hidden);
    document.addEventListener('visibilitychange', alCambiarVisibilidad);
    inject(DestroyRef).onDestroy(() =>
      document.removeEventListener('visibilitychange', alCambiarVisibilidad),
    );
  }
}
