import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ProyectosService, ResumenProyecto } from '../../services/proyectos.service';
import { Proyectos } from './proyectos';

const resumen = (id: number, nombre: string, versiones = 2): ResumenProyecto => ({
  id,
  nombre,
  creado_en: '2026-10-19T10:00:00.000Z',
  actualizado_en: '2026-10-19T15:00:00.000Z',
  versiones,
  ultima_orden: 'agrega un formulario de contacto',
});

function montar(lista: ResumenProyecto[]) {
  const servicio = {
    listar: vi.fn(() => of(lista)),
    renombrar: vi.fn((id: number, nombre: string) => of({ ...resumen(id, nombre), versiones: [] })),
    eliminar: vi.fn(() => of(undefined)),
  };
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: ProyectosService, useValue: servicio },
    ],
  });
  const fixture = TestBed.createComponent(Proyectos);
  fixture.detectChanges();
  return { fixture, raiz: fixture.nativeElement as HTMLElement, servicio };
}

describe('/proyectos', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('lista cada proyecto con su número de versiones, su última orden y un enlace para abrirlo', () => {
    const { raiz } = montar([resumen(3, 'Café Pasto'), resumen(4, 'Barbería', 1)]);
    expect(raiz.querySelector('h1')?.textContent).toMatch(/Mis proyectos/);
    const filas = [...raiz.querySelectorAll('.proyecto')];
    expect(filas.map((f) => f.querySelector('.proyecto__nombre')!.textContent!.trim())).toEqual([
      'Café Pasto',
      'Barbería',
    ]);
    expect(filas[0].textContent).toMatch(/2 versiones/);
    expect(filas[1].textContent).toMatch(/1 versión/);
    expect(filas[0].textContent).toContain('agrega un formulario de contacto');
    expect(filas[0].querySelector('a')?.getAttribute('href')).toBe('/app?proyecto=3');
  });

  it('sin proyectos, invita a crear el primero', () => {
    const { raiz } = montar([]);
    expect(raiz.querySelector('.vacio')?.textContent).toMatch(/Todavía no/);
    expect(raiz.querySelector('.vacio a')?.getAttribute('href')).toBe('/app');
  });

  it('renombrar en línea', () => {
    const { fixture, raiz, servicio } = montar([resumen(3, 'Café Pasto')]);
    raiz.querySelector<HTMLButtonElement>('.renombrar')!.click();
    fixture.detectChanges();
    const campo = raiz.querySelector<HTMLInputElement>('.proyecto input')!;
    expect(document.activeElement === campo || campo).toBeTruthy();
    campo.value = 'Café Real';
    campo.dispatchEvent(new Event('input'));
    raiz.querySelector<HTMLFormElement>('.proyecto form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(servicio.renombrar).toHaveBeenCalledWith(3, 'Café Real');
    expect(raiz.querySelector('.proyecto__nombre')?.textContent?.trim()).toBe('Café Real');
  });

  it('borrar pide confirmación en línea', () => {
    const { fixture, raiz, servicio } = montar([resumen(3, 'Café Pasto')]);
    raiz.querySelector<HTMLButtonElement>('.borrar')!.click();
    fixture.detectChanges();
    expect(servicio.eliminar).not.toHaveBeenCalled();
    expect(raiz.querySelector('.confirmar')?.textContent).toMatch(/¿Borrar «Café Pasto»/);
    raiz.querySelector<HTMLButtonElement>('.confirmar__si')!.click();
    fixture.detectChanges();
    expect(servicio.eliminar).toHaveBeenCalledWith(3);
    expect(raiz.querySelectorAll('.proyecto')).toHaveLength(0);
  });
});
