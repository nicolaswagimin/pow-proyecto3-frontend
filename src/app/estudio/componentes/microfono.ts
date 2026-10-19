import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';
import { Icon } from '../../ui/icon/icon';

const PASOS = 5;

// El micrófono protagonista de /app. Los anillos crecen con el volumen REAL del micrófono (Web
// Audio, voz/nivel-microfono.ts): si se mueven, es porque te está oyendo (docs/decisiones/0005).
// Con movimiento reducido, los anillos no se animan y un vúmetro en pasos muestra lo mismo.
@Component({
  selector: 'ui-microfono',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './microfono.html',
  styleUrl: './microfono.css',
})
export class Microfono {
  readonly escuchando = input(false, { transform: booleanAttribute });
  readonly nivel = input(0);
  readonly compacto = input(false, { transform: booleanAttribute });
  readonly deshabilitado = input(false, { transform: booleanAttribute });
  readonly pulsar = output<void>();

  protected readonly nivelVisible = computed(() =>
    this.escuchando() ? Math.round(this.nivel() * 100) / 100 : 0,
  );
  protected readonly pasos = computed(() =>
    Array.from({ length: PASOS }, (_, i) => this.nivelVisible() > i / PASOS),
  );
}
