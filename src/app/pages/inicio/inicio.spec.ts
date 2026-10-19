import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ErrorPagina, EventoPagina, PaginasService } from '../../services/paginas.service';
import { ProyectosService } from '../../services/proyectos.service';
import { NivelMicrofono } from '../../voz/nivel-microfono';
import { Inicio } from './inicio';

const PAGINA =
  '<!DOCTYPE html><html lang="es"><head><title>Café Pasto</title></head><body>' +
  '<header data-vtw="encabezado"><h1>Café Pasto</h1></header><footer data-vtw="pie"></footer></body></html>';

function montar({
  query = {},
  generar,
}: { query?: Record<string, string>; generar?: () => Promise<unknown> } = {}) {
  const paginas = {
    generar: vi.fn(
      generar ??
        (async (_o: string, alEvento: (e: EventoPagina) => void) => {
          const f = {
            html: PAGINA,
            titulo: 'Café Pasto',
            desdeCache: false,
            modo: 'completo' as const,
          };
          alEvento({ tipo: 'parcial', trozo: PAGINA });
          alEvento({ tipo: 'final', ...f });
          return f;
        }),
    ),
    editar: vi.fn(),
  };
  const version = { id: 9, base_id: null, orden: 'x', tipo: 'crear', html: PAGINA, creado_en: '' };
  const proyectos = {
    crear: vi.fn(() =>
      of({ id: 3, nombre: 'Café Pasto', creado_en: '', actualizado_en: '', versiones: [version] }),
    ),
    agregarVersion: vi.fn(),
    obtener: vi.fn(() =>
      of({ id: 5, nombre: 'Guardado', creado_en: '', actualizado_en: '', versiones: [version] }),
    ),
  };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: PaginasService, useValue: paginas },
      { provide: ProyectosService, useValue: proyectos },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { queryParamMap: convertToParamMap(query) } },
      },
    ],
  });
  TestBed.overrideComponent(Inicio, {
    add: {
      providers: [
        {
          provide: NivelMicrofono,
          useValue: { nivel: () => 0, abrir: async () => {}, cerrar: () => {} },
        },
      ],
    },
  });
  const fixture = TestBed.createComponent(Inicio);
  fixture.detectChanges();
  return { fixture, raiz: fixture.nativeElement as HTMLElement, paginas, proyectos };
}

async function estable(fixture: { detectChanges(): void; whenStable(): Promise<unknown> }) {
  for (let i = 0; i < 4; i++) {
    fixture.detectChanges();
    await fixture.whenStable();
  }
}

describe('/app (Inicio)', () => {
  beforeEach(() =>
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} })),
  );
  afterEach(() => vi.unstubAllGlobals());

  it('estado vacío: un solo h1, el gran micrófono, la orden y los ejemplos', () => {
    vi.stubGlobal('webkitSpeechRecognition', class {});
    const { raiz } = montar();
    expect(raiz.querySelectorAll('h1')).toHaveLength(1);
    expect(raiz.querySelector('h1')?.textContent).toMatch(/Qué página quieres crear/);
    expect(raiz.querySelector('ui-microfono button.microfono')).not.toBeNull();
    expect(raiz.querySelector('ui-orden textarea')).not.toBeNull();
    expect(raiz.querySelectorAll('ui-ejemplos button').length).toBeGreaterThanOrEqual(4);
    expect(raiz.querySelector('ui-ventana')).toBeNull();
  });

  it('sin Web Speech API no hay micrófono: aviso y teclado', () => {
    const { raiz } = montar();
    expect(raiz.querySelector('ui-microfono')).toBeNull();
    expect(raiz.querySelector('.aviso-teclado')?.textContent).toMatch(/no permite dictar/);
  });

  it('un ejemplo crea la página y pasa al estudio: ventana, versiones y acciones', async () => {
    const { fixture, raiz, paginas } = montar();
    raiz.querySelector<HTMLButtonElement>('ui-ejemplos button')!.click();
    await estable(fixture);
    expect(paginas.generar).toHaveBeenCalled();
    expect(raiz.querySelector('ui-ventana iframe')?.getAttribute('sandbox')).toBe('');
    expect(raiz.querySelector('ui-ventana .ventana__nombre')?.textContent?.trim()).toBe(
      'Café Pasto',
    );
    expect(raiz.querySelectorAll('ui-linea-tiempo .version')).toHaveLength(1);
    const acciones = [...raiz.querySelectorAll('.acciones ui-button, .acciones a')].map((b) =>
      b.textContent!.trim(),
    );
    expect(acciones).toEqual(
      expect.arrayContaining(['Descargar', 'Copiar código', 'Nueva página']),
    );
    expect(raiz.querySelector('h1')?.textContent).toContain('Café Pasto');
  });

  it('un error de la IA se muestra con Reintentar y la orden no se pierde', async () => {
    const { fixture, raiz } = montar({
      generar: async () =>
        Promise.reject(new ErrorPagina('La IA devolvió una página inválida dos veces.', 502)),
    });
    const campo = raiz.querySelector<HTMLTextAreaElement>('ui-orden textarea')!;
    campo.value = 'una tienda';
    campo.dispatchEvent(new Event('input'));
    raiz.querySelector<HTMLFormElement>('ui-orden form')!.dispatchEvent(new Event('submit'));
    await estable(fixture);
    const alerta = raiz.querySelector('.error-ia');
    expect(alerta?.textContent).toMatch(/inválida/);
    expect(alerta?.querySelector('button')?.textContent).toMatch(/Reintentar/);
    expect(raiz.querySelector<HTMLTextAreaElement>('ui-orden textarea')!.value).toBe('una tienda');
  });

  it('?proyecto=5 abre un proyecto guardado', async () => {
    const { fixture, raiz, proyectos } = montar({ query: { proyecto: '5' } });
    await estable(fixture);
    expect(proyectos.obtener).toHaveBeenCalledWith(5);
    expect(raiz.querySelector('ui-ventana')).not.toBeNull();
  });

  it('los anuncios van en una región role="status"', () => {
    const { raiz } = montar();
    expect(raiz.querySelector('.anuncio')?.getAttribute('role')).toBe('status');
  });
});
