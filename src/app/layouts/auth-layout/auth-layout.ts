import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { APP_NOMBRE } from '../../config';
import { esTactil, esperar, prefiereMenosMovimiento } from '../../core/movimiento';
import { Cielo } from '../../fx/cielo/cielo';
import { Estallido } from '../../fx/estallido/estallido';
import { ThemeToggle } from '../../ui/theme-toggle/theme-toggle';

const SALIDA = 'cubic-bezier(0.16, 1, 0.3, 1)';
const ENTRADA = 'cubic-bezier(0.7, 0, 0.84, 0)';
const RESORTE = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

// Plantilla de acceso a pantalla dividida: un panel de atardecer (cielo, sol y dunas) y el
// formulario en una tarjeta con brillo holográfico. Al cambiar de modo, el panel del sol
// cruza al otro lado con un rebote de resorte.
@Component({
  selector: 'app-auth-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Cielo, ThemeToggle, Estallido],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.css',
  host: { '[class.tactil]': 'tactil' },
})
export class AuthLayout {
  readonly modo = input<'login' | 'registro'>('login');

  protected readonly nombreApp = APP_NOMBRE;
  protected readonly tactil = esTactil();
  protected readonly cascada = signal(true);

  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  private readonly tarjeta = viewChild.required<ElementRef<HTMLElement>>('tarjeta');
  private readonly holo = viewChild.required<ElementRef<HTMLElement>>('holo');
  private readonly contenido = viewChild.required<ElementRef<HTMLElement>>('contenido');
  private readonly estallido = viewChild.required(Estallido);
  private readonly injector = inject(Injector);
  private cuadro = 0;

  constructor() {
    const fin = setTimeout(() => this.cascada.set(false), 2200);
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(fin);
      cancelAnimationFrame(this.cuadro);
    });
  }

  // Brillo holográfico: un reflejo iridiscente sigue al mouse y la tarjeta se inclina apenas.
  protected brillar(evento: PointerEvent): void {
    if (this.tactil || evento.pointerType !== 'mouse' || prefiereMenosMovimiento()) return;
    const caja = this.tarjeta().nativeElement.getBoundingClientRect();
    const x = evento.clientX - caja.left;
    const y = evento.clientY - caja.top;
    const rx = -(y / caja.height - 0.5) * 6;
    const ry = (x / caja.width - 0.5) * 6;
    cancelAnimationFrame(this.cuadro);
    this.cuadro = requestAnimationFrame(() => {
      this.holo().nativeElement.style.transform = `translate3d(${x.toFixed(0)}px, ${y.toFixed(0)}px, 0)`;
      this.tarjeta().nativeElement.style.transform = `perspective(1000px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    });
  }

  protected apagarBrillo(): void {
    cancelAnimationFrame(this.cuadro);
    this.tarjeta().nativeElement.style.transform = '';
  }

  // Cambio de modo: el contenido se desvanece hacia el lado al que se va, el panel cruza con
  // rebote (transición CSS ligada al modo) y el contenido nuevo entra desde el lado contrario.
  async transformar(cambiar: () => void): Promise<void> {
    const contenido = this.contenido().nativeElement;

    if (prefiereMenosMovimiento()) {
      await contenido.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: 'forwards' })
        .finished;
      cambiar();
      await this.trasRender();
      contenido.getAnimations().forEach((a) => a.cancel());
      await contenido.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160 }).finished;
      return;
    }

    this.apagarBrillo();
    // Hacia registro, el formulario viaja a la izquierda; hacia login, a la derecha.
    const sentido = this.modo() === 'login' ? -1 : 1;
    const salientes = this.olas();
    const salida = salientes.map((el, i) =>
      el.animate(
        [
          { opacity: 1, transform: 'none', filter: 'blur(0)' },
          { opacity: 0, transform: `translateX(${sentido * 30}px)`, filter: 'blur(6px)' },
        ],
        { duration: 180, delay: i * 25, easing: ENTRADA, fill: 'forwards' },
      ),
    );
    await Promise.all(salida.map((a) => a.finished));

    const movil = matchMedia('(max-width: 860px)').matches;
    if (movil) {
      // En móvil la banda del sol se pliega y se despliega.
      this.panel().nativeElement.animate(
        [{ transform: 'none' }, { transform: 'scaleY(0.2)', offset: 0.4 }, { transform: 'none' }],
        { duration: 800, easing: SALIDA },
      );
    }

    cambiar();
    await this.trasRender();
    salida.forEach((a) => a.cancel());

    const entrantes = this.olas();
    const entrada = entrantes.map((el, i) =>
      el.animate(
        [
          { opacity: 0, transform: `translateX(${-sentido * 50}px)`, filter: 'blur(6px)' },
          { opacity: 1, transform: 'none', filter: 'blur(0)' },
        ],
        { duration: 520, delay: 260 + i * 55, easing: RESORTE, fill: 'backwards' },
      ),
    );
    await Promise.all([...entrada.map((a) => a.finished), esperar(900)]);
  }

  // Error: sacudida tipo espejismo, con temblor y una distorsión breve.
  sacudir(): void {
    if (prefiereMenosMovimiento()) {
      this.tarjeta().nativeElement.animate([{ opacity: 0.6 }, { opacity: 1 }], { duration: 300 });
      return;
    }
    this.tarjeta().nativeElement.animate(
      [
        { transform: 'none', filter: 'blur(0)' },
        { transform: 'translateX(-10px) skewX(8deg)', filter: 'blur(1.5px)' },
        { transform: 'translateX(9px) skewX(-6deg)', filter: 'blur(0.5px)' },
        { transform: 'translateX(-6px) skewX(4deg)', filter: 'blur(1px)' },
        { transform: 'translateX(3px) skewX(-2deg)', filter: 'blur(0)' },
        { transform: 'none', filter: 'blur(0)' },
      ],
      { duration: 520, easing: 'ease-out' },
    );
  }

  // Éxito: estallido solar desde el botón y la tarjeta se disuelve en la luz.
  async celebrar(origen: { x: number; y: number }): Promise<void> {
    const tarjeta = this.tarjeta().nativeElement;
    const caja = tarjeta.getBoundingClientRect();
    await this.estallido().lanzar(origen, {
      x: caja.left + caja.width / 2,
      y: caja.top + caja.height / 2,
    });
    if (prefiereMenosMovimiento()) return;
    await tarjeta.animate(
      [
        { opacity: 1, transform: 'none', filter: 'blur(0) brightness(1)' },
        { opacity: 0, transform: 'scale(1.06)', filter: 'blur(8px) brightness(1.6)' },
      ],
      { duration: 360, easing: ENTRADA, fill: 'forwards' },
    ).finished;
  }

  private olas(): HTMLElement[] {
    return Array.from(this.contenido().nativeElement.querySelectorAll<HTMLElement>('[data-ola]'));
  }

  private async trasRender(): Promise<void> {
    await new Promise<void>((resolver) =>
      afterNextRender(() => resolver(), { injector: this.injector }),
    );
    await esperar(0);
  }
}
