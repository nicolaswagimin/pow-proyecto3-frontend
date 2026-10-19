import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';
import { Icon } from '../../ui/icon/icon';
import { Version } from '../versiones';

// Las versiones del proyecto con la orden que produjo cada una. Se vuelve a cualquiera con un clic;
// deshacer y rehacer navegan por el árbol (docs/versiones.md). Ninguna se borra.
@Component({
  selector: 'ui-linea-tiempo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './linea-tiempo.html',
  styleUrl: './linea-tiempo.css',
})
export class LineaTiempo {
  readonly versiones = input<Version[]>([]);
  readonly actual = input<number | null>(null);
  readonly puedeDeshacer = input(false, { transform: booleanAttribute });
  readonly puedeRehacer = input(false, { transform: booleanAttribute });
  readonly irA = output<number>();
  readonly deshacer = output<void>();
  readonly rehacer = output<void>();

  private static readonly hora = new Intl.DateTimeFormat('es-CO', {
    hour: 'numeric',
    minute: '2-digit',
  });

  protected readonly filas = computed(() => {
    const vs = this.versiones();
    const numero = new Map(vs.map((v, i) => [v.id, i + 1]));
    return vs.map((v, i) => ({
      ...v,
      numero: i + 1,
      // Si no salió de la inmediatamente anterior, es otra rama: se dice de cuál.
      rama:
        v.base_id !== null && i > 0 && vs[i - 1].id !== v.base_id ? numero.get(v.base_id) : null,
      hora: v.creado_en ? LineaTiempo.hora.format(new Date(v.creado_en)) : '',
    }));
  });
}
