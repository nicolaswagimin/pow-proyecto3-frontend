import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

// Avatar con las iniciales sobre un degradado de atardecer. Con [amanecer], un sol con rayos
// sale por detrás del círculo al cargar la pantalla.
@Component({
  selector: 'ui-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="halo" aria-hidden="true"><span class="halo__rayos"></span></span>
    <span class="disco" aria-hidden="true">{{ iniciales() }}</span>
  `,
  styleUrl: './avatar.css',
  host: { '[class.amanecer]': 'amanecer()' },
})
export class Avatar {
  readonly iniciales = input.required<string>();
  readonly amanecer = input(false, { transform: booleanAttribute });
}
