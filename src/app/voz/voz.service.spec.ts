import { TestBed } from '@angular/core/testing';
import { IDIOMAS_VOZ, VozService } from './voz.service';

// Un reconocedor de la Web Speech API simulado: la prueba decide qué "oye".
class ReconocedorFalso {
  static ultimo: ReconocedorFalso;
  lang = '';
  interimResults = false;
  continuous = false;
  maxAlternatives = 1;
  onresult: ((e: unknown) => void) | null = null;
  onerror: ((e: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  onspeechstart: (() => void) | null = null;
  onspeechend: (() => void) | null = null;
  iniciado = false;
  constructor() {
    ReconocedorFalso.ultimo = this;
  }
  start() {
    this.iniciado = true;
  }
  stop() {
    this.onend?.();
  }
  abort() {
    this.onend?.();
  }
  // Resultados acumulados como los entrega el navegador: [texto, esFinal][]
  oir(resultados: [string, boolean][], desde = 0) {
    const results = resultados.map(([t, isFinal]) => ({ isFinal, 0: { transcript: t } }));
    this.onresult?.({ resultIndex: desde, results });
  }
}

function crear() {
  (globalThis as unknown as Record<string, unknown>)['webkitSpeechRecognition'] = ReconocedorFalso;
  TestBed.resetTestingModule();
  return TestBed.inject(VozService);
}

describe('VozService.escucharOrden', () => {
  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      /* sin almacenamiento */
    }
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    delete (globalThis as unknown as Record<string, unknown>)['webkitSpeechRecognition'];
  });

  it('escucha en español de Colombia por defecto, de forma continua y con interinos', () => {
    const voz = crear();
    void voz.escucharOrden();
    const r = ReconocedorFalso.ultimo;
    expect(r.lang).toBe('es-CO');
    expect(r.continuous).toBe(true);
    expect(r.interimResults).toBe(true);
    expect(voz.escuchando()).toBe(true);
  });

  it('muestra el texto palabra por palabra y lo confirma; se detiene tras el silencio', async () => {
    const voz = crear();
    const orden = voz.escucharOrden();
    const r = ReconocedorFalso.ultimo;
    r.oir([['una landing', false]]);
    expect(voz.interino()).toBe('una landing');
    r.oir([['una landing para una cafetería', true]]);
    expect(voz.confirmado()).toBe('una landing para una cafetería');
    expect(voz.interino()).toBe('');
    r.oir([
      ['una landing para una cafetería', true],
      [' en Pasto', false],
    ]);
    expect(voz.interino()).toBe('en Pasto');
    r.oir(
      [
        ['una landing para una cafetería', true],
        [' en Pasto', true],
      ],
      1,
    );
    vi.advanceTimersByTime(2600);
    await expect(orden).resolves.toBe('una landing para una cafetería en Pasto');
    expect(voz.escuchando()).toBe(false);
  });

  it('antes de la primera palabra espera 7 s; después, 2.5 s de silencio', async () => {
    const voz = crear();
    const orden = voz.escucharOrden();
    vi.advanceTimersByTime(3000);
    expect(voz.escuchando()).toBe(true);
    vi.advanceTimersByTime(4100);
    await expect(orden).rejects.toThrow(/No te escuché/);
  });

  it('detener() termina la escucha con lo que se dijo', async () => {
    const voz = crear();
    const orden = voz.escucharOrden();
    ReconocedorFalso.ultimo.oir([['cambia el título a azul', true]]);
    voz.detener();
    await expect(orden).resolves.toBe('cambia el título a azul');
  });

  it('errores con mensajes amables: permiso, sin micrófono, red y silencio', async () => {
    for (const [error, mensaje] of [
      ['not-allowed', /permiso/],
      ['audio-capture', /micrófono/],
      ['network', /conexión/],
      ['no-speech', /No te escuché/],
    ] as const) {
      const voz = crear();
      const orden = voz.escucharOrden();
      ReconocedorFalso.ultimo.onerror?.({ error });
      ReconocedorFalso.ultimo.onend?.();
      await expect(orden).rejects.toThrow(mensaje);
    }
  });

  it('se puede cambiar a otro español y se recuerda', () => {
    const voz = crear();
    expect(IDIOMAS_VOZ.map((i) => i.codigo)).toContain('es-MX');
    voz.cambiarIdioma('es-MX');
    void voz.escucharOrden();
    expect(ReconocedorFalso.ultimo.lang).toBe('es-MX');
    expect(crear().idioma()).toBe('es-MX');
  });

  it('un idioma desconocido no se acepta', () => {
    const voz = crear();
    voz.cambiarIdioma('fr-FR');
    expect(voz.idioma()).toBe('es-CO');
  });

  it('sin Web Speech API (Firefox): no disponible y escucharOrden rechaza con un aviso', async () => {
    TestBed.resetTestingModule();
    const voz = TestBed.inject(VozService);
    expect(voz.disponible).toBe(false);
    await expect(voz.escucharOrden()).rejects.toThrow(/no permite dictar/);
  });
});
