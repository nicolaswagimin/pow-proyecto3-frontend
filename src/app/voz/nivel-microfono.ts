import { Injectable, signal } from '@angular/core';

// El volumen real del micrófono con Web Audio (getUserMedia + AnalyserNode): alimenta la
// visualización de la voz en /app. Si la animación se mueve, es porque el micrófono oye algo
// (docs/decisiones/0005, que actualiza la 0004). Ver docs/voz.md.

const MENSAJES: Record<string, string> = {
  NotAllowedError:
    'No tengo permiso para usar el micrófono. Actívalo en el navegador o escribe la orden.',
  SecurityError: 'El navegador no permite usar el micrófono en esta página. Escribe la orden.',
  NotFoundError: 'No encuentro un micrófono. Conecta uno o escribe la orden.',
  OverconstrainedError: 'No encuentro un micrófono que funcione. Conecta uno o escribe la orden.',
  NotReadableError: 'Otra aplicación está usando el micrófono. Ciérrala o escribe la orden.',
};

// RMS de una ventana de muestras, escalado para que una voz normal llene buena parte del rango.
export function nivelRms(muestras: Float32Array): number {
  let suma = 0;
  for (const m of muestras) suma += m * m;
  const rms = Math.sqrt(suma / (muestras.length || 1));
  return Math.min(1, rms * 6);
}

interface Pista {
  stop(): void;
}

// Se provee en el componente que lo usa (y se reemplaza en las pruebas).
@Injectable()
export class NivelMicrofono {
  readonly nivel = signal(0);
  private stream: { getTracks(): Pista[] } | null = null;
  private contexto: { close(): Promise<void> } | null = null;
  private cuadro = 0;
  // Cada abrir() y cerrar() cambia la apertura vigente: si el permiso llega después de un cerrar()
  // (o de otro abrir()), ese stream ya no sirve y se apaga enseguida.
  private apertura = 0;

  async abrir(): Promise<void> {
    this.cerrar();
    const mia = this.apertura;
    const medios = (globalThis.navigator as Navigator | undefined)?.mediaDevices;
    if (!medios?.getUserMedia) {
      throw new Error('Este navegador no deja usar el micrófono aquí. Escribe la orden.');
    }
    let stream: MediaStream;
    try {
      stream = await medios.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
    } catch (err) {
      const nombre = (err as { name?: string }).name ?? '';
      throw new Error(MENSAJES[nombre] ?? 'No se pudo abrir el micrófono. Escribe la orden.');
    }
    if (mia !== this.apertura) {
      stream.getTracks().forEach((p) => p.stop());
      return;
    }
    this.stream = stream;
    const Contexto =
      (globalThis as { AudioContext?: typeof AudioContext }).AudioContext ??
      (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Contexto) return; // sin Web Audio: se dicta igual, sin visualización
    const contexto = new Contexto();
    this.contexto = contexto;
    const analizador = contexto.createAnalyser();
    analizador.fftSize = 1024;
    analizador.smoothingTimeConstant = 0.6;
    contexto.createMediaStreamSource(stream).connect(analizador);
    const muestras = new Float32Array(analizador.fftSize);
    const medir = () => {
      analizador.getFloatTimeDomainData(muestras);
      // Suavizado: sube rápido y baja despacio, como un vúmetro.
      const actual = nivelRms(muestras);
      const anterior = this.nivel();
      this.nivel.set(actual > anterior ? actual : anterior * 0.85 + actual * 0.15);
      this.cuadro = requestAnimationFrame(medir);
    };
    this.cuadro = requestAnimationFrame(medir);
  }

  cerrar(): void {
    this.apertura++;
    cancelAnimationFrame(this.cuadro);
    this.stream?.getTracks().forEach((p) => p.stop());
    void this.contexto?.close().catch(() => {});
    this.stream = null;
    this.contexto = null;
    this.nivel.set(0);
  }
}
