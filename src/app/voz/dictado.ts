import { signal } from '@angular/core';
import { prefiereMenosMovimiento } from '../core/movimiento';
import { LineaTranscripcion } from './transcripcion';

export interface Frase {
  texto: string;
  bloque?: string; // bloque de la interfaz que se ensambla cuando la frase se confirma
}

let siguienteId = 0;

// Reproduce un guion como si alguien lo dictara: cada frase aparece palabra por palabra como
// texto interino, se confirma y entonces ensambla su bloque de la interfaz. saltar() termina todo
// de inmediato. Con movimiento reducido o la pestaña oculta no hay reproducción: todo aparece listo.
export class Dictado {
  readonly lineas = signal<LineaTranscripcion[]>([]);
  readonly ensamblados = signal<ReadonlySet<string>>(new Set());
  readonly enCurso = signal(false);

  private cola: { frase: Frase; id: number }[] = [];
  private temporizador: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly msPorPalabra = 110,
    private readonly pausa = 280,
  ) {}

  reproducir(frases: Frase[]): void {
    for (const frase of frases) this.cola.push({ frase, id: ++siguienteId });
    if (prefiereMenosMovimiento() || document.hidden) {
      this.saltar();
      return;
    }
    if (!this.enCurso()) this.siguiente();
  }

  saltar(): void {
    clearTimeout(this.temporizador);
    for (const { frase, id } of this.cola) this.confirmar(frase, id);
    this.cola = [];
    this.enCurso.set(false);
  }

  // Vuelve a empezar: borra el guion y desarma los bloques.
  reiniciar(): void {
    this.saltar();
    this.lineas.set([]);
    this.ensamblados.set(new Set());
  }

  ensamblado(bloque: string): boolean {
    return this.ensamblados().has(bloque);
  }

  // Línea nueva fuera del guion (el dictado real de la persona o una respuesta de la app).
  agregar(quien: 'tu' | 'app', texto = '', interino = ''): number {
    const id = ++siguienteId;
    this.lineas.update((l) => [...l, { id, quien, texto, interino }]);
    return id;
  }

  actualizar(id: number, cambios: Partial<Omit<LineaTranscripcion, 'id'>>): void {
    this.lineas.update((l) =>
      l.map((linea) => (linea.id === id ? { ...linea, ...cambios } : linea)),
    );
  }

  quitar(id: number): void {
    this.lineas.update((l) => l.filter((linea) => linea.id !== id));
  }

  detener(): void {
    clearTimeout(this.temporizador);
  }

  private siguiente(): void {
    const actual = this.cola[0];
    if (!actual) {
      this.enCurso.set(false);
      return;
    }
    this.enCurso.set(true);
    // La línea aparece cuando empieza a dictarse, no antes.
    this.lineas.update((l) => [...l, { id: actual.id, quien: 'tu', texto: '', interino: '' }]);
    const palabras = actual.frase.texto.split(' ');
    let dichas = 0;
    const paso = () => {
      dichas++;
      if (dichas <= palabras.length) {
        this.actualizar(actual.id, { interino: palabras.slice(0, dichas).join(' ') });
        this.temporizador = setTimeout(paso, this.msPorPalabra);
        return;
      }
      this.cola.shift();
      this.confirmar(actual.frase, actual.id);
      this.temporizador = setTimeout(() => this.siguiente(), this.pausa);
    };
    paso();
  }

  private confirmar(frase: Frase, id: number): void {
    if (this.lineas().some((linea) => linea.id === id)) {
      this.actualizar(id, { texto: frase.texto, interino: '' });
    } else {
      this.lineas.update((l) => [...l, { id, quien: 'tu', texto: frase.texto }]);
    }
    if (frase.bloque) {
      const bloque = frase.bloque;
      this.ensamblados.update((s) => new Set(s).add(bloque));
    }
  }
}
