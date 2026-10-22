import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import {
  ErrorPagina,
  EventoPagina,
  PaginaFinal,
  PaginasService,
} from '../services/paginas.service';
import { ProyectosService } from '../services/proyectos.service';
import { NivelMicrofono } from '../voz/nivel-microfono';
import { VozService } from '../voz/voz.service';
import { EstudioEstado } from './estudio-estado';
import { Version } from './versiones';

const pagina = (titulo: string, extra = '') =>
  `<!DOCTYPE html><html lang="es"><head><title>${titulo}</title><style>h1{color:navy}</style></head><body>` +
  `<header data-vtw="encabezado"><h1>${titulo}</h1></header>` +
  `<section data-vtw="menu"><h2>Menú</h2></section>${extra}` +
  `<footer data-vtw="pie"><p>Pasto</p></footer></body></html>`;

const final = (html: string, extra: Partial<PaginaFinal> = {}): PaginaFinal => ({
  html,
  titulo: html.match(/<title>(.*?)<\/title>/)?.[1] ?? null,
  desdeCache: false,
  modo: 'completo',
  ...extra,
});

// La IA simulada manda la página en trozos, como el stream real.
function iaFalsa(respuestas: (string | Error | PaginaFinal)[]) {
  const llamadas: { tipo: 'generar' | 'editar'; orden: string; html?: string }[] = [];
  const responder = async (alEvento: (e: EventoPagina) => void) => {
    const r = respuestas[llamadas.length - 1];
    if (r instanceof Error) throw r;
    const f = typeof r === 'string' ? final(r) : r;
    alEvento({ tipo: 'inicio' });
    if (!f.desdeCache)
      for (let i = 0; i < f.html.length; i += 40)
        alEvento({ tipo: 'parcial', trozo: f.html.slice(i, i + 40) });
    alEvento({ tipo: 'final', ...f });
    return f;
  };
  return {
    llamadas,
    servicio: {
      generar: vi.fn((orden: string, alEvento: (e: EventoPagina) => void) => {
        llamadas.push({ tipo: 'generar', orden });
        return responder(alEvento);
      }),
      editar: vi.fn((html: string, orden: string, alEvento: (e: EventoPagina) => void) => {
        llamadas.push({ tipo: 'editar', orden, html });
        return responder(alEvento);
      }),
    },
  };
}

function proyectosFalsos({ fallar = false } = {}) {
  let id = 100;
  const versiones: Version[] = [];
  const nueva = (v: Partial<Version>): Version =>
    ({
      id: ++id,
      base_id: null,
      creado_en: '',
      orden: '',
      tipo: 'crear',
      html: '',
      ...v,
    }) as Version;
  return {
    versiones,
    servicio: {
      crear: vi.fn((nombre: string, v: Partial<Version>) => {
        if (fallar) return throwError(() => new Error('sin red'));
        const primera = nueva(v);
        versiones.push(primera);
        return of({ id: 1, nombre, creado_en: '', actualizado_en: '', versiones: [primera] });
      }),
      agregarVersion: vi.fn((_id: number, v: Partial<Version>) => {
        const n = nueva(v);
        versiones.push(n);
        return of(n);
      }),
      obtener: vi.fn(() =>
        of({
          id: 1,
          nombre: 'Guardado',
          creado_en: '',
          actualizado_en: '',
          versiones: [...versiones],
        }),
      ),
    },
  };
}

function preparar({
  ia = iaFalsa([pagina('Café Pasto')]),
  proyectos = proyectosFalsos(),
  dictado = 'una cafetería en Pasto',
} = {}) {
  const voz = {
    disponible: true,
    escuchando: vi.fn(() => false),
    oyendoVoz: vi.fn(() => false),
    interino: vi.fn(() => ''),
    confirmado: vi.fn(() => ''),
    idioma: vi.fn(() => 'es-CO'),
    escucharOrden: vi.fn(async () => dictado),
    detener: vi.fn(),
  };
  const nivel = { nivel: vi.fn(() => 0), abrir: vi.fn(async () => {}), cerrar: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      EstudioEstado,
      { provide: PaginasService, useValue: ia.servicio },
      { provide: ProyectosService, useValue: proyectos.servicio },
      { provide: VozService, useValue: voz },
      { provide: NivelMicrofono, useValue: nivel },
    ],
  });
  return { estado: TestBed.inject(EstudioEstado), ia, proyectos, voz, nivel };
}

describe('EstudioEstado', () => {
  it('empieza vacío, con ejemplos para probar', () => {
    const { estado } = preparar();
    expect(estado.fase()).toBe('vacio');
    expect(estado.ejemplos.length).toBeGreaterThanOrEqual(4);
    expect(estado.documento()).toBeNull();
  });

  it('crear por texto: genera, arma los bloques, guarda el proyecto y crea la versión 1', async () => {
    const { estado, ia, proyectos } = preparar();
    estado.orden.set('una cafetería en Pasto');
    await estado.enviar();
    expect(ia.llamadas).toEqual([{ tipo: 'generar', orden: 'una cafetería en Pasto' }]);
    expect(estado.fase()).toBe('listo');
    expect(estado.progreso().bloques.map((b) => b.nombre)).toEqual([
      'Encabezado',
      'Menú',
      'Pie de página',
    ]);
    expect(proyectos.servicio.crear).toHaveBeenCalledWith('Café Pasto', {
      orden: 'una cafetería en Pasto',
      tipo: 'crear',
      html: pagina('Café Pasto'),
    });
    expect(estado.proyecto()?.nombre).toBe('Café Pasto');
    expect(estado.versiones()).toHaveLength(1);
    expect(estado.guardado()).toBe('guardado');
    expect(estado.documento()).toContain('Content-Security-Policy');
    expect(estado.orden()).toBe('');
  });

  it('crear por voz: lo dictado queda para revisar antes de enviar', async () => {
    const { estado, ia, nivel } = preparar();
    await estado.dictar();
    expect(nivel.abrir).toHaveBeenCalled();
    expect(nivel.cerrar).toHaveBeenCalled();
    expect(estado.orden()).toBe('una cafetería en Pasto');
    expect(ia.llamadas).toHaveLength(0);
  });

  it('un comando dictado se ejecuta sin revisar ni llamar a la IA', async () => {
    const { estado, ia } = preparar({
      ia: iaFalsa([pagina('A'), pagina('B')]),
      dictado: 'deshacer',
    });
    estado.orden.set('x');
    await estado.enviar();
    estado.orden.set('cambia el título a B');
    await estado.enviar();
    await estado.dictar();
    expect(ia.llamadas).toHaveLength(2);
    expect(estado.actual()?.html).toBe(pagina('A'));
    expect(estado.anuncio()).toMatch(/Deshecho/);
  });

  it('editar: manda el HTML actual, crea la versión 2 desde la 1 y resalta lo que cambió', async () => {
    const editada = pagina(
      'Café Pasto',
      '<section data-vtw="contacto"><h2>Contacto</h2></section>',
    );
    const { estado, ia, proyectos } = preparar({ ia: iaFalsa([pagina('Café Pasto'), editada]) });
    estado.orden.set('una cafetería');
    await estado.enviar();
    const primera = estado.actual()!.id;
    estado.orden.set('agrega un formulario de contacto');
    await estado.enviar();
    expect(ia.llamadas[1]).toEqual({
      tipo: 'editar',
      orden: 'agrega un formulario de contacto',
      html: pagina('Café Pasto'),
    });
    expect(proyectos.servicio.agregarVersion).toHaveBeenCalledWith(1, {
      base_id: primera,
      orden: 'agrega un formulario de contacto',
      tipo: 'editar',
      html: editada,
    });
    expect(estado.versiones()).toHaveLength(2);
    expect(estado.resaltados()).toEqual(['contacto']);
    expect(estado.anuncio()).toBe('Cambió: Contacto (nuevo).');
    expect(estado.documento()).toContain('data-vtw-cambio');
  });

  it('deshacer, rehacer y volver a una versión, sin perder ninguna', async () => {
    const { estado } = preparar({ ia: iaFalsa([pagina('A'), pagina('B'), pagina('C')]) });
    for (const o of ['a', 'b']) {
      estado.orden.set(o);
      await estado.enviar();
    }
    const [v1, v2] = estado.versiones();
    estado.deshacer();
    expect(estado.actual()?.id).toBe(v1.id);
    expect(estado.puedeRehacer()).toBe(true);
    estado.rehacer();
    expect(estado.actual()?.id).toBe(v2.id);
    estado.irA(v1.id);
    estado.orden.set('c');
    await estado.enviar(); // edita desde la 1: rama nueva
    expect(estado.versiones()).toHaveLength(3);
    expect(estado.actual()?.base_id).toBe(v1.id);
    estado.deshacer();
    expect(estado.actual()?.id).toBe(v1.id);
    expect(estado.puedeDeshacer()).toBe(false);
  });

  it('nueva página vuelve al estado vacío; descargar baja el HTML saneado', async () => {
    const { estado } = preparar();
    estado.orden.set('x');
    await estado.enviar();
    const descargas: { nombre: string; contenido: string }[] = [];
    estado.descargarArchivo = (nombre, contenido) => descargas.push({ nombre, contenido });
    estado.orden.set('descargar');
    await estado.enviar();
    expect(descargas[0].nombre).toBe('cafe-pasto.html');
    expect(descargas[0].contenido).not.toContain('data-vtw-');
    estado.orden.set('nueva página');
    await estado.enviar();
    expect(estado.fase()).toBe('vacio');
    expect(estado.proyecto()).toBeNull();
  });

  it('errores amables: cuota, respuesta inválida (con reintento) y sin conexión', async () => {
    const { estado } = preparar({
      ia: iaFalsa([
        new ErrorPagina('Se agotó la cuota de la IA por ahora.', 429),
        new ErrorPagina('La IA devolvió una página inválida dos veces.', 502),
        new ErrorPagina('No hay conexión con el servidor.', 0),
        pagina('Ok'),
      ]),
    });
    estado.orden.set('x');
    await estado.enviar();
    expect(estado.error()).toEqual({
      mensaje: 'Se agotó la cuota de la IA por ahora.',
      reintentar: false,
    });
    await estado.enviar();
    expect(estado.error()).toEqual({
      mensaje: 'La IA devolvió una página inválida dos veces.',
      reintentar: true,
    });
    expect(estado.orden()).toBe('x'); // no se pierde lo que se escribió
    await estado.reintentar();
    expect(estado.error()?.mensaje).toMatch(/conexión/);
    await estado.reintentar();
    expect(estado.error()).toBeNull();
    expect(estado.fase()).toBe('listo');
  });

  it('micrófono denegado: avisa y el teclado sigue', async () => {
    const { estado, voz } = preparar();
    voz.escucharOrden.mockRejectedValueOnce(new Error('No tengo permiso para usar el micrófono.'));
    await estado.dictar();
    expect(estado.errorVoz()).toMatch(/permiso/);
    estado.orden.set('una tienda');
    await estado.enviar();
    expect(estado.fase()).toBe('listo');
  });

  it('si no se puede guardar, la versión queda y se reintenta al guardar de nuevo', async () => {
    const proyectos = proyectosFalsos({ fallar: true });
    const { estado } = preparar({ proyectos });
    estado.orden.set('x');
    await estado.enviar();
    expect(estado.versiones()).toHaveLength(1);
    expect(estado.guardado()).toBe('error');
    proyectos.servicio.crear.mockImplementation((nombre: string, v: Partial<Version>) =>
      of({
        id: 1,
        nombre,
        creado_en: '',
        actualizado_en: '',
        versiones: [{ id: 501, base_id: null, creado_en: '', ...v } as Version],
      }),
    );
    await estado.guardarPendientes();
    expect(estado.guardado()).toBe('guardado');
    expect(estado.versiones()[0].id).toBe(501);
  });

  it('guardar dos veces a la vez no duplica el proyecto ni las versiones', async () => {
    const proyectos = proyectosFalsos({ fallar: true });
    const { estado } = preparar({ proyectos });
    estado.orden.set('x');
    await estado.enviar();
    const respuesta = new Subject<unknown>();
    proyectos.servicio.crear.mockImplementation(() => respuesta as never);
    const primero = estado.guardarPendientes();
    const segundo = estado.guardarPendientes();
    await Promise.resolve();
    respuesta.next({
      id: 1,
      nombre: 'x',
      creado_en: '',
      actualizado_en: '',
      versiones: [{ id: 501, base_id: null }],
    });
    await Promise.all([primero, segundo]);
    expect(proyectos.servicio.crear).toHaveBeenCalledTimes(2); // el fallido y uno solo después
    expect(proyectos.servicio.agregarVersion).not.toHaveBeenCalled();
    expect(estado.versiones().map((v) => v.id)).toEqual([501]);
  });

  it('nueva página mientras se guarda: lo que llega del guardado viejo no entra en la nueva', async () => {
    const proyectos = proyectosFalsos();
    const respuesta = new Subject<unknown>();
    proyectos.servicio.crear.mockImplementation(() => respuesta as never);
    const { estado } = preparar({ proyectos });
    estado.confirmar = () => true;
    estado.orden.set('x');
    const enviando = estado.enviar();
    await vi.waitFor(() => expect(proyectos.servicio.crear).toHaveBeenCalled());
    expect(estado.nueva()).toBe(true);
    respuesta.next({
      id: 1,
      nombre: 'x',
      creado_en: '',
      actualizado_en: '',
      versiones: [{ id: 501, base_id: null }],
    });
    await enviando;
    expect(estado.proyecto()).toBeNull();
    expect(estado.versiones()).toEqual([]);
    expect(estado.guardado()).toBeNull();
  });

  it('nueva página con versiones sin guardar pide confirmación y, si no, no borra nada', async () => {
    const { estado } = preparar({ proyectos: proyectosFalsos({ fallar: true }) });
    estado.orden.set('x');
    await estado.enviar();
    const preguntas: string[] = [];
    estado.confirmar = (m: string) => (preguntas.push(m), false);
    expect(estado.nueva()).toBe(false);
    expect(preguntas[0]).toMatch(/sin guardar/);
    expect(estado.versiones()).toHaveLength(1);
    await estado.cargar(1);
    expect(estado.versiones()[0].id).toBeLessThan(0);
  });

  it('nueva página aborta la petición a la IA que estaba en curso', async () => {
    let senal: AbortSignal | undefined;
    const ia = {
      llamadas: [],
      servicio: {
        generar: vi.fn((_o: string, _e: unknown, s?: AbortSignal) => {
          senal = s;
          return new Promise(() => {});
        }),
        editar: vi.fn(),
      },
    };
    const { estado } = preparar({ ia: ia as never });
    estado.orden.set('x');
    void estado.enviar();
    expect(senal?.aborted).toBe(false);
    estado.nueva();
    expect(senal?.aborted).toBe(true);
  });

  it('la vista en construcción muestra solo los bloques que ya llegaron', async () => {
    const vistos: string[] = [];
    const ia = {
      llamadas: [],
      servicio: {
        generar: vi.fn(async (_o: string, alEvento: (e: EventoPagina) => void) => {
          const html = pagina('Café');
          const corte = html.indexOf('<section');
          alEvento({ tipo: 'parcial', trozo: html.slice(0, corte + 20) });
          vistos.push(estado.documento() ?? '');
          alEvento({ tipo: 'parcial', trozo: html.slice(corte + 20) });
          alEvento({ tipo: 'final', ...final(html) });
          return final(html);
        }),
        editar: vi.fn(),
      },
    };
    const { estado } = preparar({ ia: ia as never });
    estado.orden.set('x');
    await estado.enviar();
    expect(vistos[0]).toContain('data-vtw="encabezado"');
    expect(vistos[0]).not.toContain('data-vtw="menu"');
  });

  it('abrir un proyecto guardado carga todas sus versiones y muestra la última', async () => {
    const proyectos = proyectosFalsos();
    proyectos.versiones.push(
      { id: 7, base_id: null, orden: 'a', tipo: 'crear', html: pagina('A'), creado_en: '' },
      { id: 8, base_id: 7, orden: 'b', tipo: 'editar', html: pagina('B'), creado_en: '' },
    );
    const { estado } = preparar({ proyectos });
    await estado.cargar(1);
    expect(estado.proyecto()).toEqual({ id: 1, nombre: 'Guardado' });
    expect(estado.versiones().map((v) => v.id)).toEqual([7, 8]);
    expect(estado.actual()?.id).toBe(8);
    expect(estado.fase()).toBe('listo');
  });
});
