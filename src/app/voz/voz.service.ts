import { Injectable, signal } from '@angular/core';

// Tipos mínimos de la Web Speech API: no todos los navegadores la traen en sus tipos.
interface ResultadoReconocimiento {
  readonly isFinal: boolean;
  readonly 0: { readonly transcript: string };
}

interface EventoReconocimiento {
  readonly resultIndex: number;
  readonly results: ArrayLike<ResultadoReconocimiento>;
}

interface Reconocedor {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((e: EventoReconocimiento) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type ConstructorReconocedor = new () => Reconocedor;

// Variantes de español para el reconocimiento: Colombia por defecto (docs/voz.md).
export const IDIOMAS_VOZ = [
  { codigo: 'es-CO', nombre: 'Español de Colombia' },
  { codigo: 'es-MX', nombre: 'Español de México' },
  { codigo: 'es-ES', nombre: 'Español de España' },
  { codigo: 'es-AR', nombre: 'Español de Argentina' },
  { codigo: 'es-CL', nombre: 'Español de Chile' },
  { codigo: 'es-PE', nombre: 'Español de Perú' },
  { codigo: 'es-US', nombre: 'Español de Estados Unidos' },
] as const;

const CLAVE_IDIOMA = 'vtw.idioma-voz';
const IDIOMA_POR_DEFECTO = 'es-CO';
// Tras este silencio (sin resultados nuevos) la orden se da por terminada.
const SILENCIO_MS = 2500;
// Antes de la primera palabra se espera más: la persona puede estar pensando qué decir.
const ESPERA_INICIAL_MS = 7000;

function leerIdioma(): string {
  try {
    const guardado = localStorage.getItem(CLAVE_IDIOMA);
    return IDIOMAS_VOZ.some((i) => i.codigo === guardado) ? guardado! : IDIOMA_POR_DEFECTO;
  } catch {
    return IDIOMA_POR_DEFECTO;
  }
}

// Mensajes para dictar una orden en /app (el teclado siempre queda como salida).
const MENSAJES_ORDEN: Record<string, string> = {
  'not-allowed':
    'No tengo permiso para usar el micrófono. Actívalo en el navegador o escribe la orden.',
  'service-not-allowed': 'El navegador no permite dictar aquí. Escribe la orden con el teclado.',
  'no-speech': 'No te escuché. Pulsa el micrófono e inténtalo de nuevo, o escribe la orden.',
  'audio-capture': 'No encuentro un micrófono. Conecta uno o escribe la orden.',
  network: 'El dictado necesita conexión a internet. Revisa tu conexión o escribe la orden.',
  'language-not-supported': 'Este navegador no reconoce esa variante del español. Prueba con otra.',
};

const MENSAJES: Record<string, string> = {
  'not-allowed': 'No tengo permiso para usar el micrófono. Puedes escribir con el teclado.',
  'service-not-allowed': 'El navegador no permite dictar aquí. Puedes escribir con el teclado.',
  'no-speech': 'No te escuché. Inténtalo de nuevo o escribe con el teclado.',
  'audio-capture': 'No encuentro un micrófono. Puedes escribir con el teclado.',
  network: 'El dictado necesita conexión a internet. Puedes escribir con el teclado.',
};

// Dictado con la Web Speech API (Chrome, Edge y Safari). Expone el texto interino (lo que el
// reconocedor todavía puede corregir) y el final, como signals. Si el navegador no la soporta,
// `disponible` es false y la interfaz no muestra el micrófono: el teclado siempre funciona.
@Injectable({ providedIn: 'root' })
export class VozService {
  private readonly Reconocedor: ConstructorReconocedor | undefined =
    (globalThis as { SpeechRecognition?: ConstructorReconocedor }).SpeechRecognition ??
    (globalThis as { webkitSpeechRecognition?: ConstructorReconocedor }).webkitSpeechRecognition;

  readonly disponible = Boolean(this.Reconocedor);
  // El micrófono está abierto (se enciende el piloto REC).
  readonly escuchando = signal(false);
  // El reconocedor detecta voz en este momento (speechstart / speechend).
  readonly oyendoVoz = signal(false);
  readonly interino = signal('');

  private actual: Reconocedor | null = null;

  // Dictado de órdenes en /app.
  readonly idioma = signal(leerIdioma());
  readonly confirmado = signal('');

  // Escucha una sola frase en español y la devuelve ya confirmada.
  dictar(idioma = 'es-ES'): Promise<string> {
    if (!this.Reconocedor) {
      return Promise.reject(new Error('Este navegador no permite dictar. Escribe con el teclado.'));
    }
    this.detener();
    const reconocedor = new this.Reconocedor();
    reconocedor.lang = idioma;
    reconocedor.interimResults = true;
    reconocedor.continuous = false;
    reconocedor.maxAlternatives = 1;
    this.actual = reconocedor;

    return new Promise<string>((resolver, rechazar) => {
      let final = '';
      reconocedor.onresult = (e) => {
        let interino = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const resultado = e.results[i];
          if (resultado.isFinal) final += resultado[0].transcript;
          else interino += resultado[0].transcript;
        }
        this.interino.set(interino);
      };
      reconocedor.onspeechstart = () => this.oyendoVoz.set(true);
      reconocedor.onspeechend = () => this.oyendoVoz.set(false);
      reconocedor.onerror = (e) => {
        if (e.error === 'aborted') return;
        rechazar(new Error(MENSAJES[e.error] ?? 'No se pudo dictar. Escribe con el teclado.'));
      };
      reconocedor.onend = () => {
        this.escuchando.set(false);
        this.oyendoVoz.set(false);
        this.interino.set('');
        this.actual = null;
        if (final.trim()) resolver(final.trim());
        else rechazar(new Error(MENSAJES['no-speech']));
      };
      this.escuchando.set(true);
      reconocedor.start();
    });
  }

  cambiarIdioma(codigo: string): void {
    if (!IDIOMAS_VOZ.some((i) => i.codigo === codigo)) return;
    this.idioma.set(codigo);
    try {
      localStorage.setItem(CLAVE_IDIOMA, codigo);
    } catch {
      // Sin almacenamiento, la elección dura esta visita.
    }
  }

  // Escucha una orden completa: continua, con el texto interino palabra por palabra, hasta un
  // silencio de 2.5 s o hasta detener(). Devuelve todo lo confirmado, para revisarlo antes de enviar.
  escucharOrden(): Promise<string> {
    if (!this.Reconocedor) {
      return Promise.reject(
        new Error(
          'Este navegador no permite dictar (por ejemplo, Firefox). Escribe la orden con el teclado.',
        ),
      );
    }
    this.detener();
    const reconocedor = new this.Reconocedor();
    reconocedor.lang = this.idioma();
    reconocedor.interimResults = true;
    reconocedor.continuous = true;
    reconocedor.maxAlternatives = 1;
    this.actual = reconocedor;
    this.confirmado.set('');
    this.interino.set('');

    return new Promise<string>((resolver, rechazar) => {
      let error: string | null = null;
      let silencio: ReturnType<typeof setTimeout> | undefined;
      const esperarSilencio = (ms = SILENCIO_MS) => {
        clearTimeout(silencio);
        silencio = setTimeout(() => reconocedor.stop(), ms);
      };
      const limpio = (t: string) => t.replace(/\s+/g, ' ').trim();
      reconocedor.onresult = (e) => {
        let final = '';
        let interino = '';
        for (let i = 0; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) final += r[0].transcript;
          else interino += r[0].transcript;
        }
        this.confirmado.set(limpio(final));
        this.interino.set(limpio(interino));
        esperarSilencio();
      };
      reconocedor.onspeechstart = () => this.oyendoVoz.set(true);
      reconocedor.onspeechend = () => this.oyendoVoz.set(false);
      reconocedor.onerror = (e) => {
        if (e.error !== 'aborted') error = e.error;
      };
      reconocedor.onend = () => {
        clearTimeout(silencio);
        const texto = limpio(`${this.confirmado()} ${this.interino()}`);
        this.escuchando.set(false);
        this.oyendoVoz.set(false);
        this.interino.set('');
        this.confirmado.set(texto);
        this.actual = null;
        if (error && !(error === 'no-speech' && texto)) {
          rechazar(
            new Error(
              MENSAJES_ORDEN[error] ?? 'No se pudo dictar. Escribe la orden con el teclado.',
            ),
          );
        } else if (texto) resolver(texto);
        else rechazar(new Error(MENSAJES_ORDEN['no-speech']));
      };
      this.escuchando.set(true);
      reconocedor.start();
      esperarSilencio(ESPERA_INICIAL_MS);
    });
  }

  detener(): void {
    this.actual?.stop();
  }
}
