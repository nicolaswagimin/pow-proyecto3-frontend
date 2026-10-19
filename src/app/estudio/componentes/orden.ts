import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  model,
  output,
} from '@angular/core';
import { Button } from '../../ui/button/button';
import { Icon } from '../../ui/icon/icon';
import { IDIOMAS_VOZ } from '../../voz/voz.service';

let siguiente = 0;

// La orden: lo que se está dictando en vivo (confirmado en tinta, interino en gris e itálica) y el
// campo para revisarlo y editarlo antes de enviar. El teclado siempre hace lo mismo que la voz.
@Component({
  selector: 'ui-orden',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Icon],
  templateUrl: './orden.html',
  styleUrl: './orden.css',
})
export class Orden {
  readonly texto = model('');
  readonly confirmado = input('');
  readonly interino = input('');
  readonly escuchando = input(false, { transform: booleanAttribute });
  readonly disponible = input(true, { transform: booleanAttribute });
  readonly idioma = input('es-CO');
  readonly enviando = input(false, { transform: booleanAttribute });
  readonly etiquetaEnviar = input('Crear la página');
  readonly enviar = output<string>();
  readonly cambiarIdioma = output<string>();

  protected readonly IDIOMAS = IDIOMAS_VOZ;
  protected readonly id = `orden-${++siguiente}`;
  protected readonly vacio = computed(() => !this.texto().trim());

  protected alEscribir(evento: Event): void {
    this.texto.set((evento.target as HTMLTextAreaElement).value);
  }

  protected alTeclear(evento: KeyboardEvent): void {
    if (evento.key === 'Enter' && !evento.shiftKey && !evento.isComposing) {
      evento.preventDefault();
      this.mandar();
    }
  }

  protected mandar(evento?: Event): void {
    evento?.preventDefault();
    if (!this.vacio() && !this.enviando()) this.enviar.emit(this.texto().trim());
  }

  protected alElegir(evento: Event): void {
    this.cambiarIdioma.emit((evento.target as HTMLSelectElement).value);
  }
}
