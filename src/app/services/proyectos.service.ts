import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type { Version } from '../estudio/versiones';

export interface ResumenProyecto {
  id: number;
  nombre: string;
  creado_en: string;
  actualizado_en: string;
  versiones: number;
  ultima_orden: string | null;
}

export interface Proyecto {
  id: number;
  nombre: string;
  creado_en: string;
  actualizado_en: string;
  versiones: Version[];
}

export type NuevaVersion = Pick<Version, 'orden' | 'tipo' | 'html'>;

// Proyectos guardados con todo su historial de versiones (el token lo agrega el interceptor).
@Injectable({ providedIn: 'root' })
export class ProyectosService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/proyectos`;

  listar(): Observable<ResumenProyecto[]> {
    return this.http.get<ResumenProyecto[]>(this.url);
  }

  obtener(id: number): Observable<Proyecto> {
    return this.http.get<Proyecto>(`${this.url}/${id}`);
  }

  crear(nombre: string, version: NuevaVersion): Observable<Proyecto> {
    return this.http.post<Proyecto>(this.url, { nombre, version });
  }

  agregarVersion(
    id: number,
    version: NuevaVersion & { base_id: number | null },
  ): Observable<Version> {
    return this.http.post<Version>(`${this.url}/${id}/versiones`, version);
  }

  renombrar(id: number, nombre: string): Observable<Proyecto> {
    return this.http.patch<Proyecto>(`${this.url}/${id}`, { nombre });
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
