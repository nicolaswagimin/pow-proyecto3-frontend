import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { TemaService } from '../../core/tema.service';
import { esperar, leerToken, prefiereMenosMovimiento } from '../../core/movimiento';

interface Chispa {
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  vida: number;
  color: string;
}

interface Punto {
  x: number;
  y: number;
}

// Celebración de éxito: un estallido solar de rayos que se abren desde el botón, fuegos
// artificiales de chispas doradas y un check que se dibuja dentro de un sol.
@Component({
  selector: 'fx-estallido',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <canvas #lienzo></canvas>
    @if (centro(); as c) {
      <div class="sol" [style.left.px]="c.x" [style.top.px]="c.y">
        <span class="sol__rayos"></span>
        <svg viewBox="0 0 64 64">
          <circle class="sol__disco" cx="32" cy="32" r="24" />
          <path class="sol__check" d="M21 33l7.5 7.5L44 25" pathLength="100" />
        </svg>
      </div>
    }
  `,
  styleUrl: './estallido.css',
  host: { 'aria-hidden': 'true' },
})
export class Estallido {
  protected readonly centro = signal<Punto | null>(null);
  private readonly tema = inject(TemaService);
  private readonly lienzo = viewChild.required<ElementRef<HTMLCanvasElement>>('lienzo');

  async lanzar(origen: Punto, centro: Punto): Promise<void> {
    this.centro.set(centro);
    if (prefiereMenosMovimiento()) {
      await esperar(700);
      return;
    }
    await Promise.all([this.animar(origen, centro), esperar(1500)]);
  }

  private animar(origen: Punto, centro: Punto): Promise<void> {
    const lienzo = this.lienzo().nativeElement;
    const ctx = lienzo.getContext('2d');
    if (!ctx) return Promise.resolve();

    const dpr = Math.min(devicePixelRatio || 1, 1.75);
    lienzo.width = Math.round(innerWidth * dpr);
    lienzo.height = Math.round(innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const colores = ['--brillo-1', '--brillo-2', '--brillo-3', '--sol'].map(leerToken);
    // En oscuro las chispas se suman como luz; en claro se pintan encima.
    const oscuro = this.tema.tema() === 'oscuro';
    const chispas: Chispa[] = [];
    const movil = innerWidth < 600;

    // Tres fuegos artificiales escalonados alrededor del centro de la tarjeta.
    const fuegos = [
      { t: 150, x: centro.x - 140, y: centro.y - 160 },
      { t: 380, x: centro.x + 150, y: centro.y - 120 },
      { t: 620, x: centro.x, y: centro.y - 220 },
    ];
    const lanzarFuego = (x: number, y: number) => {
      const cantidad = movil ? 26 : 44;
      for (let i = 0; i < cantidad; i++) {
        const angulo = (i / cantidad) * Math.PI * 2;
        const fuerza = 2.5 + Math.random() * 3.5;
        chispas.push({
          x,
          y,
          px: x,
          py: y,
          vx: Math.cos(angulo) * fuerza,
          vy: Math.sin(angulo) * fuerza,
          vida: 1,
          color: colores[Math.floor(Math.random() * colores.length)],
        });
      }
    };

    return new Promise((resolver) => {
      const inicio = performance.now();
      let ultimo = inicio;
      const paso = (t: number) => {
        const transcurrido = t - inicio;
        const dt = Math.min((t - ultimo) / 16.67, 3);
        ultimo = t;
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        ctx.globalCompositeOperation = oscuro ? 'lighter' : 'source-over';

        // Estallido solar: rayos que se abren desde el botón y se desvanecen.
        const avance = Math.min(transcurrido / 700, 1);
        if (avance < 1) {
          const largo = Math.max(innerWidth, innerHeight) * avance;
          ctx.lineWidth = 6 * (1 - avance) + 1;
          ctx.globalAlpha = 1 - avance;
          for (let i = 0; i < 28; i++) {
            const angulo = (i / 28) * Math.PI * 2 + avance * 0.4;
            const desde = largo * 0.25;
            const degradado = ctx.createLinearGradient(
              origen.x + Math.cos(angulo) * desde,
              origen.y + Math.sin(angulo) * desde,
              origen.x + Math.cos(angulo) * largo,
              origen.y + Math.sin(angulo) * largo,
            );
            degradado.addColorStop(0, colores[1]);
            degradado.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.strokeStyle = degradado;
            ctx.beginPath();
            ctx.moveTo(origen.x + Math.cos(angulo) * desde, origen.y + Math.sin(angulo) * desde);
            ctx.lineTo(origen.x + Math.cos(angulo) * largo, origen.y + Math.sin(angulo) * largo);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }

        while (fuegos.length && transcurrido >= fuegos[0].t) {
          const fuego = fuegos.shift()!;
          lanzarFuego(fuego.x, fuego.y);
        }

        // Chispas con estela: se dibuja una línea desde la posición anterior.
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        let vivas = 0;
        for (const c of chispas) {
          if (c.vida <= 0) continue;
          vivas++;
          c.px = c.x;
          c.py = c.y;
          c.vx *= 0.965;
          c.vy = c.vy * 0.965 + 0.06 * dt;
          c.x += c.vx * dt;
          c.y += c.vy * dt;
          c.vida -= 0.018 * dt;
          ctx.globalAlpha = Math.max(c.vida, 0);
          ctx.strokeStyle = c.color;
          ctx.beginPath();
          ctx.moveTo(c.px - c.vx * 2, c.py - c.vy * 2);
          ctx.lineTo(c.x, c.y);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;

        if (transcurrido < 700 || fuegos.length || vivas > 0) {
          requestAnimationFrame(paso);
        } else {
          ctx.clearRect(0, 0, innerWidth, innerHeight);
          resolver();
        }
      };
      requestAnimationFrame(paso);
    });
  }
}
