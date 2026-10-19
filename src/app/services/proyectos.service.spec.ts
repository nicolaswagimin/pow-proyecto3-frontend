import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { ProyectosService } from './proyectos.service';

describe('ProyectosService', () => {
  let servicio: ProyectosService;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/proyectos`;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(ProyectosService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('crear manda el nombre y la primera versión', async () => {
    const r = firstValueFrom(
      servicio.crear('Café', { orden: 'una cafetería', tipo: 'crear', html: '<html></html>' }),
    );
    const p = http.expectOne(url);
    expect(p.request.method).toBe('POST');
    expect(p.request.body).toEqual({
      nombre: 'Café',
      version: { orden: 'una cafetería', tipo: 'crear', html: '<html></html>' },
    });
    p.flush({ id: 1, nombre: 'Café', versiones: [] });
    expect((await r).id).toBe(1);
  });

  it('agregarVersion, listar, obtener, renombrar y eliminar usan sus rutas', () => {
    servicio.agregarVersion(1, { base_id: 2, orden: 'x', tipo: 'editar', html: 'h' }).subscribe();
    const v = http.expectOne(`${url}/1/versiones`);
    expect(v.request.body).toEqual({ base_id: 2, orden: 'x', tipo: 'editar', html: 'h' });
    v.flush({});
    servicio.listar().subscribe();
    http.expectOne(url).flush([]);
    servicio.obtener(3).subscribe();
    http.expectOne(`${url}/3`).flush({});
    servicio.renombrar(3, 'Nuevo').subscribe();
    const r = http.expectOne(`${url}/3`);
    expect(r.request.method).toBe('PATCH');
    r.flush({});
    servicio.eliminar(3).subscribe();
    expect(http.expectOne(`${url}/3`).request.method).toBe('DELETE');
  });
});
