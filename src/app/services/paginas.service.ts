import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthService } from '../core/auth.service';

// Generar y editar páginas con la IA. La respuesta llega en stream NDJSON (un evento por línea) y
// la página se arma en vivo. Si el stream no llega, se corta o un proxy lo almacena en búfer, se
// repite automáticamente sin stream (?stream=0) y el progreso se muestra igual
// (docs/decisiones/0008 y docs/funcionalidades.md). HttpClient no entrega el cuerpo a medida que
// llega, por eso aquí se usa fetch.

export interface PaginaFinal {
  html: string;
  titulo: string | null;
  desdeCache: boolean;
  modo: 'completo' | 'secciones';
}

export type EventoPagina =
  | { tipo: 'inicio' }
  | { tipo: 'latido' }
  | { tipo: 'fase'; texto: string }
  | { tipo: 'parcial'; trozo: string }
  | { tipo: 'reintento'; motivo: string }
  | { tipo: 'sin-stream' } // el cliente pasó a la alternativa sin stream
  | ({ tipo: 'final' } & PaginaFinal)
  | { tipo: 'error'; estado: number; error: string };

export class ErrorPagina extends Error {
  constructor(
    mensaje: string,
    readonly estado: number,
  ) {
    super(mensaje);
  }
}

// Sin un byte en este tiempo, el stream no está llegando (un proxy que lo retiene o una conexión
// colgada). El servidor manda un latido cada 3 s, así que un silencio así no es normal.
export const ESPERA_STREAM_MS = 12_000;

// Se repite sin stream solo si el problema puede ser el stream; un error con mensaje del servidor
// (400, 401, 429, IA inválida) se muestra tal cual.
class StreamFallido extends Error {}

function mensajePorEstado(estado: number, delServidor?: string): string {
  if (estado === 0)
    return 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.';
  if (estado === 401) return 'Tu sesión expiró. Inicia sesión de nuevo.';
  if (estado === 429) return delServidor ?? 'Pediste muchas páginas seguidas. Espera unos minutos.';
  return delServidor ?? 'Algo falló al generar la página. Inténtalo de nuevo en unos segundos.';
}

@Injectable({ providedIn: 'root' })
export class PaginasService {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router, { optional: true });

  generar(
    orden: string,
    alEvento: (e: EventoPagina) => void,
    signal?: AbortSignal,
  ): Promise<PaginaFinal> {
    return this.pedir('generar', { orden }, alEvento, signal);
  }

  editar(
    html: string,
    orden: string,
    alEvento: (e: EventoPagina) => void,
    signal?: AbortSignal,
  ): Promise<PaginaFinal> {
    return this.pedir('editar', { html, orden }, alEvento, signal);
  }

  private async pedir(
    ruta: 'generar' | 'editar',
    cuerpo: object,
    alEvento: (e: EventoPagina) => void,
    signal?: AbortSignal,
  ): Promise<PaginaFinal> {
    const url = `${environment.apiUrl}/paginas/${ruta}`;
    try {
      return await this.enStream(url, cuerpo, alEvento, signal);
    } catch (err) {
      if (!(err instanceof StreamFallido) || signal?.aborted) throw err;
      alEvento({ tipo: 'sin-stream' });
      return this.sinStream(`${url}?stream=0`, cuerpo, signal);
    }
  }

  private cabeceras(): Record<string, string> {
    const token = this.auth.token();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async fallar(respuesta: Response): Promise<never> {
    const datos = await respuesta.json().catch(() => null);
    if (respuesta.status === 401) {
      this.auth.cerrarSesion();
      void this.router
        ?.navigate(['/login'], { queryParams: { sesion: 'expirada' } })
        .catch(() => {});
    }
    throw new ErrorPagina(mensajePorEstado(respuesta.status, datos?.error), respuesta.status);
  }

  private async enviar(url: string, cuerpo: object, signal: AbortSignal): Promise<Response> {
    try {
      return await fetch(url, {
        method: 'POST',
        headers: this.cabeceras(),
        body: JSON.stringify(cuerpo),
        signal,
      });
    } catch (err) {
      if (globalThis.navigator?.onLine === false) throw new ErrorPagina(mensajePorEstado(0), 0);
      throw err;
    }
  }

  private async enStream(
    url: string,
    cuerpo: object,
    alEvento: (e: EventoPagina) => void,
    externa?: AbortSignal,
  ): Promise<PaginaFinal> {
    const control = new AbortController();
    const abortarExterna = () => control.abort();
    externa?.addEventListener('abort', abortarExterna);
    let vigilante: ReturnType<typeof setTimeout> | undefined;
    let sinNoticias = false;
    // Cada byte que llega reinicia la espera.
    const vigilar = () => {
      clearTimeout(vigilante);
      vigilante = setTimeout(() => {
        sinNoticias = true;
        control.abort();
      }, ESPERA_STREAM_MS);
    };
    vigilar();
    try {
      let respuesta: Response;
      try {
        respuesta = await this.enviar(url, cuerpo, control.signal);
      } catch (err) {
        if (err instanceof ErrorPagina) throw err;
        throw new StreamFallido();
      }
      // Un 502/503/504 sin JSON lo puso un proxy, no el backend: se prueba sin stream.
      const esJson = respuesta.headers.get('content-type')?.includes('json');
      if (!respuesta.ok && respuesta.status >= 502 && !esJson) throw new StreamFallido();
      if (!respuesta.ok) return await this.fallar(respuesta);
      if (!respuesta.body) throw new StreamFallido();

      const lector = respuesta.body.getReader();
      const decodificador = new TextDecoder();
      let pendiente = '';
      for (;;) {
        let parte: ReadableStreamReadResult<Uint8Array>;
        try {
          parte = await lector.read();
        } catch {
          throw new StreamFallido();
        }
        if (parte.done) break;
        vigilar();
        pendiente += decodificador.decode(parte.value, { stream: true });
        let fin: number;
        while ((fin = pendiente.indexOf('\n')) !== -1) {
          const linea = pendiente.slice(0, fin).trim();
          pendiente = pendiente.slice(fin + 1);
          if (!linea) continue;
          let evento: EventoPagina;
          try {
            evento = JSON.parse(linea);
          } catch {
            continue;
          }
          if (evento.tipo === 'error')
            throw new ErrorPagina(mensajePorEstado(evento.estado, evento.error), evento.estado);
          alEvento(evento);
          if (evento.tipo === 'final') {
            const { tipo: _t, ...pagina } = evento;
            void lector.cancel().catch(() => {});
            return pagina;
          }
        }
      }
      // Terminó sin el evento final: el stream se cortó en el camino.
      throw new StreamFallido();
    } catch (err) {
      if (externa?.aborted) throw new ErrorPagina('Se canceló.', -1);
      if (sinNoticias || err instanceof StreamFallido) throw new StreamFallido();
      throw err;
    } finally {
      clearTimeout(vigilante);
      externa?.removeEventListener('abort', abortarExterna);
    }
  }

  private async sinStream(url: string, cuerpo: object, signal?: AbortSignal): Promise<PaginaFinal> {
    let respuesta: Response;
    try {
      respuesta = await this.enviar(url, cuerpo, signal ?? new AbortController().signal);
    } catch (err) {
      if (err instanceof ErrorPagina) throw err;
      throw new ErrorPagina(mensajePorEstado(0), 0);
    }
    if (!respuesta.ok) return this.fallar(respuesta);
    return (await respuesta.json()) as PaginaFinal;
  }
}
