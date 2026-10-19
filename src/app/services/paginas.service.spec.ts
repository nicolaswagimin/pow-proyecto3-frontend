import { TestBed } from '@angular/core/testing';
import { AuthService } from '../core/auth.service';
import { environment } from '../../environments/environment';
import { ErrorPagina, EventoPagina, PaginasService } from './paginas.service';

const FINAL = {
  html: '<!DOCTYPE html><html><body></body></html>',
  titulo: 'Café',
  desdeCache: false,
  modo: 'completo',
};

// Un cuerpo NDJSON que llega en trozos, con pausas opcionales (ms) entre ellos.
function ndjson(partes: (object | number | 'cortar')[]): Response {
  const cod = new TextEncoder();
  const cuerpo = new ReadableStream({
    async start(c) {
      for (const p of partes) {
        if (typeof p === 'number') await new Promise((r) => setTimeout(r, p));
        else if (p === 'cortar') return c.error(new TypeError('network error'));
        else c.enqueue(cod.encode(JSON.stringify(p) + '\n'));
      }
      c.close();
    },
  });
  return new Response(cuerpo, { status: 200, headers: { 'content-type': 'application/x-ndjson' } });
}

function preparar(
  respuestas: (Response | Error | ((url: string, init: RequestInit) => Promise<Response>))[],
) {
  const llamadas: { url: string; init: RequestInit }[] = [];
  const fetchFalso = vi.fn(async (url: string, init: RequestInit) => {
    llamadas.push({ url, init });
    const r = respuestas[llamadas.length - 1];
    if (r instanceof Error) throw r;
    return typeof r === 'function' ? r(url, init) : r;
  });
  vi.stubGlobal('fetch', fetchFalso);
  TestBed.configureTestingModule({
    providers: [{ provide: AuthService, useValue: { token: () => 'tok', cerrarSesion: vi.fn() } }],
  });
  return { servicio: TestBed.inject(PaginasService), llamadas };
}

describe('PaginasService', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('generar lee el stream: entrega cada evento y resuelve con la página final', async () => {
    const { servicio, llamadas } = preparar([
      ndjson([
        { tipo: 'inicio' },
        { tipo: 'parcial', trozo: '<!DOC' },
        { tipo: 'latido' },
        { tipo: 'parcial', trozo: 'TYPE' },
        { tipo: 'final', ...FINAL },
      ]),
    ]);
    const eventos: EventoPagina[] = [];
    const r = await servicio.generar('una cafetería', (e) => eventos.push(e));
    expect(r).toEqual(FINAL);
    expect(
      eventos.filter((e) => e.tipo === 'parcial').map((e) => (e as { trozo: string }).trozo),
    ).toEqual(['<!DOC', 'TYPE']);
    expect(llamadas[0].url).toBe(`${environment.apiUrl}/paginas/generar`);
    expect((llamadas[0].init.headers as Record<string, string>)['Authorization']).toBe(
      'Bearer tok',
    );
    expect(JSON.parse(llamadas[0].init.body as string)).toEqual({ orden: 'una cafetería' });
  });

  it('una línea partida entre dos trozos se arma bien', async () => {
    const cod = new TextEncoder();
    const linea = JSON.stringify({ tipo: 'final', ...FINAL }) + '\n';
    const cuerpo = new ReadableStream({
      start(c) {
        c.enqueue(cod.encode(linea.slice(0, 10)));
        c.enqueue(cod.encode(linea.slice(10)));
        c.close();
      },
    });
    const { servicio } = preparar([new Response(cuerpo)]);
    expect(await servicio.generar('x', () => {})).toEqual(FINAL);
  });

  it('si el stream se corta antes del final, repite sin stream y avisa', async () => {
    const { servicio, llamadas } = preparar([
      ndjson([{ tipo: 'inicio' }, { tipo: 'parcial', trozo: '<!DOC' }, 'cortar']),
      new Response(JSON.stringify(FINAL), { status: 200 }),
    ]);
    const eventos: EventoPagina[] = [];
    expect(await servicio.generar('x', (e) => eventos.push(e))).toEqual(FINAL);
    expect(llamadas[1].url).toBe(`${environment.apiUrl}/paginas/generar?stream=0`);
    expect(eventos.some((e) => e.tipo === 'sin-stream')).toBe(true);
  });

  it('si termina sin evento final, también repite sin stream', async () => {
    const { servicio, llamadas } = preparar([
      ndjson([{ tipo: 'inicio' }]),
      new Response(JSON.stringify(FINAL)),
    ]);
    expect(await servicio.generar('x', () => {})).toEqual(FINAL);
    expect(llamadas).toHaveLength(2);
  });

  it('si no llega ningún byte (un proxy que almacena en búfer), corta a los 12 s y repite sin stream', async () => {
    vi.useFakeTimers();
    const { servicio, llamadas } = preparar([
      (_u, init) =>
        new Promise((_ok, rechazar) =>
          init.signal!.addEventListener('abort', () =>
            rechazar(new DOMException('abortado', 'AbortError')),
          ),
        ),
      new Response(JSON.stringify(FINAL)),
    ]);
    const promesa = servicio.generar('x', () => {});
    await vi.advanceTimersByTimeAsync(12_100);
    expect(await promesa).toEqual(FINAL);
    expect(llamadas[1].url).toMatch(/\?stream=0$/);
    vi.useRealTimers();
  });

  it('un 502/503 del proxy sin JSON también usa la alternativa', async () => {
    const { servicio, llamadas } = preparar([
      new Response('<html>Bad gateway</html>', { status: 502 }),
      new Response(JSON.stringify(FINAL)),
    ]);
    expect(await servicio.generar('x', () => {})).toEqual(FINAL);
    expect(llamadas).toHaveLength(2);
  });

  it('un error del servidor con su mensaje no se repite: 400, 429 y el evento error', async () => {
    const casos: [Response, number, RegExp][] = [
      [
        new Response(JSON.stringify({ error: 'Dime qué página quieres.' }), { status: 400 }),
        400,
        /Dime qué página/,
      ],
      [
        new Response(JSON.stringify({ error: 'Pediste muchas páginas seguidas.' }), {
          status: 429,
        }),
        429,
        /muchas páginas/,
      ],
      [
        ndjson([
          { tipo: 'inicio' },
          { tipo: 'error', estado: 429, error: 'Se agotó la cuota de la IA.' },
        ]),
        429,
        /cuota/,
      ],
      [
        ndjson([
          { tipo: 'error', estado: 502, error: 'La IA devolvió una página inválida dos veces.' },
        ]),
        502,
        /inválida/,
      ],
    ];
    for (const [respuesta, estado, mensaje] of casos) {
      TestBed.resetTestingModule();
      const { servicio, llamadas } = preparar([respuesta]);
      const err = (await servicio.generar('x', () => {}).catch((e) => e)) as ErrorPagina;
      expect(err).toBeInstanceOf(ErrorPagina);
      expect(err.estado).toBe(estado);
      expect(err.message).toMatch(mensaje);
      expect(llamadas).toHaveLength(1);
    }
  });

  it('sin conexión: error 0 con un mensaje claro', async () => {
    vi.stubGlobal('navigator', { onLine: false });
    const { servicio } = preparar([new TypeError('Failed to fetch')]);
    const err = (await servicio.generar('x', () => {}).catch((e) => e)) as ErrorPagina;
    expect(err.estado).toBe(0);
    expect(err.message).toMatch(/conexión/);
  });

  it('un 401 cierra la sesión', async () => {
    const { servicio } = preparar([new Response(JSON.stringify({ error: 'x' }), { status: 401 })]);
    const err = (await servicio.generar('x', () => {}).catch((e) => e)) as ErrorPagina;
    expect(err.estado).toBe(401);
    expect(TestBed.inject(AuthService).cerrarSesion).toHaveBeenCalled();
  });

  it('editar manda el HTML y la orden a /paginas/editar', async () => {
    const { servicio, llamadas } = preparar([ndjson([{ tipo: 'final', ...FINAL }])]);
    await servicio.editar('<html></html>', 'azul', () => {});
    expect(llamadas[0].url).toBe(`${environment.apiUrl}/paginas/editar`);
    expect(JSON.parse(llamadas[0].init.body as string)).toEqual({
      html: '<html></html>',
      orden: 'azul',
    });
  });
});
