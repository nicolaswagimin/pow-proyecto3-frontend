import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { APP_NOMBRE } from '../../config';
import { Barra } from '../../layouts/barra/barra';
import { ProyectosService, ResumenProyecto } from '../../services/proyectos.service';
import { Alert } from '../../ui/alert/alert';
import { Icon } from '../../ui/icon/icon';

// /proyectos: los proyectos guardados con su historial. Abrir lleva a /app?proyecto=id; renombrar
// y borrar se hacen en línea (borrar pide confirmación, sin diálogo modal).
@Component({
  selector: 'app-proyectos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Barra, Alert, Icon],
  templateUrl: './proyectos.html',
  styleUrl: './proyectos.css',
})
export class Proyectos {
  private readonly servicio = inject(ProyectosService);

  protected readonly lista = signal<ResumenProyecto[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly renombrando = signal<number | null>(null);
  protected readonly borrando = signal<number | null>(null);
  protected readonly anuncio = signal('');
  protected nombreNuevo = '';

  private static readonly fecha = new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  protected readonly cuando = (iso: string) => Proyectos.fecha.format(new Date(iso));

  constructor() {
    inject(Title).setTitle(`Mis proyectos · ${APP_NOMBRE}`);
    this.servicio.listar().subscribe({
      next: (l) => this.lista.set(l),
      error: () =>
        this.error.set(
          'No se pudieron cargar tus proyectos. Revisa tu conexión e inténtalo de nuevo.',
        ),
    });
  }

  protected empezarRenombre(p: ResumenProyecto): void {
    this.borrando.set(null);
    this.nombreNuevo = p.nombre;
    this.renombrando.set(p.id);
    queueMicrotask(() => document.querySelector<HTMLInputElement>(`#nombre-${p.id}`)?.select());
  }

  protected alEscribir(evento: Event): void {
    this.nombreNuevo = (evento.target as HTMLInputElement).value;
  }

  protected guardarNombre(evento: Event, p: ResumenProyecto): void {
    evento.preventDefault();
    const nombre = this.nombreNuevo.trim();
    if (!nombre || nombre === p.nombre) return this.renombrando.set(null);
    this.servicio.renombrar(p.id, nombre).subscribe({
      next: () => {
        this.lista.update((l) => l!.map((x) => (x.id === p.id ? { ...x, nombre } : x)));
        this.renombrando.set(null);
        this.anuncio.set(`Ahora se llama «${nombre}».`);
      },
      error: () => this.error.set('No se pudo cambiar el nombre. Inténtalo de nuevo.'),
    });
  }

  protected borrar(p: ResumenProyecto): void {
    this.servicio.eliminar(p.id).subscribe({
      next: () => {
        this.lista.update((l) => l!.filter((x) => x.id !== p.id));
        this.borrando.set(null);
        this.anuncio.set(`Se borró «${p.nombre}».`);
      },
      error: () => this.error.set('No se pudo borrar el proyecto. Inténtalo de nuevo.'),
    });
  }
}
