import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { APP_NOMBRE } from '../../config';
import { AuthService } from '../../core/auth.service';
import { mapearError } from '../../core/errores';
import { ApiService, Estado, Item } from '../../services/api.service';
import { Alert } from '../../ui/alert/alert';
import { Avatar } from '../../ui/avatar/avatar';
import { Button } from '../../ui/button/button';
import { Icon } from '../../ui/icon/icon';
import { TextField } from '../../ui/text-field/text-field';
import { ThemeToggle } from '../../ui/theme-toggle/theme-toggle';
import { Dictado } from '../../voz/dictado';
import { Transcripcion } from '../../voz/transcripcion';
import { VozService } from '../../voz/voz.service';

@Component({
  selector: 'app-inicio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    Alert,
    Avatar,
    Button,
    Icon,
    TextField,
    ThemeToggle,
    Transcripcion,
  ],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly auth = inject(AuthService);

  protected readonly nombreApp = APP_NOMBRE;
  protected readonly apiUrl = environment.apiUrl;
  protected readonly usuario = this.auth.usuario;
  protected readonly primerNombre = computed(
    () => (this.usuario()?.nombre ?? '').trim().split(/\s+/)[0] || 'de nuevo',
  );

  // Guion de la sesión: lo dictado y las respuestas de la app, como en el acceso.
  protected readonly voz = inject(VozService);
  private readonly dictado = new Dictado();
  private readonly idEnVivo = signal<number | null>(null);
  protected readonly lineas = computed(() =>
    this.dictado
      .lineas()
      .map((linea) =>
        linea.id === this.idEnVivo() ? { ...linea, interino: this.voz.interino() || '…' } : linea,
      ),
  );
  private readonly campoPregunta = viewChild.required<TextField>('campoPregunta');

  // Estado de conexión
  protected readonly estado = signal<Estado | null>(null);
  protected readonly cargandoEstado = signal(true);
  protected readonly puntosEstado = computed(() => {
    const estado = this.estado();
    const revisando = this.cargandoEstado();
    const punto = (nombre: string, ok: boolean | undefined, falla: string) => ({
      nombre,
      estado: revisando ? 'revisando' : ok ? 'ok' : 'falla',
      resultado: revisando ? 'Revisando…' : ok ? 'Responde' : falla,
    });
    return [
      punto('Backend', estado?.ok, 'No responde'),
      punto('Base de datos', estado?.db, estado ? 'No responde' : 'Sin datos'),
      punto('IA', estado?.ia, estado ? 'Sin configurar' : 'Sin datos'),
    ];
  });

  // Registros
  protected readonly items = signal<Item[]>([]);
  protected readonly cargandoItems = signal(false);
  protected readonly guardando = signal(false);
  protected readonly errorItems = signal('');
  protected readonly formItem = this.fb.group({
    titulo: ['', [Validators.required, Validators.maxLength(200)]],
    descripcion: [''],
  });

  // IA
  protected readonly formIA = this.fb.group({ pregunta: ['', Validators.required] });
  protected readonly respuesta = signal('');
  protected readonly pensando = signal(false);
  protected readonly errorIA = signal('');

  constructor() {
    inject(Title).setTitle(`Inicio · ${APP_NOMBRE}`);
    this.auth.refrescarUsuario();
    this.revisarEstado();
    this.dictado.agregar(
      'app',
      `Hola, ${this.primerNombre()}. ${this.voz.disponible ? 'Dicta' : 'Escribe'} una pregunta para la IA.`,
    );
  }

  // Dictar la pregunta: la frase aparece en el guion mientras se reconoce y, al confirmarse, se
  // agrega al campo. El teclado siempre sirve.
  protected async dictarPregunta(): Promise<void> {
    if (this.voz.escuchando()) {
      this.voz.detener();
      return;
    }
    const id = this.dictado.agregar('tu');
    this.idEnVivo.set(id);
    try {
      const dicho = await this.voz.dictar();
      this.dictado.actualizar(id, { texto: dicho });
      const control = this.formIA.controls.pregunta;
      control.setValue([control.value.trim(), dicho].filter(Boolean).join(' '));
    } catch (e) {
      this.dictado.quitar(id);
      this.dictado.agregar('app', e instanceof Error ? e.message : 'No se pudo dictar.');
    } finally {
      this.idEnVivo.set(null);
      this.campoPregunta().enfocar();
    }
  }

  protected revisarEstado(): void {
    this.cargandoEstado.set(true);
    this.api.estado().subscribe({
      next: (estado) => {
        this.estado.set(estado);
        this.cargandoEstado.set(false);
        if (estado.db) this.cargarItems();
      },
      error: () => {
        this.estado.set(null);
        this.cargandoEstado.set(false);
      },
    });
  }

  private cargarItems(): void {
    this.cargandoItems.set(true);
    this.api.listar().subscribe({
      next: (items) => {
        this.items.set(items);
        this.errorItems.set('');
        this.cargandoItems.set(false);
      },
      error: (err) => {
        this.errorItems.set(mapearError(err).mensaje);
        this.cargandoItems.set(false);
      },
    });
  }

  protected crear(): void {
    const { titulo, descripcion } = this.formItem.getRawValue();
    if (!titulo.trim() || this.guardando()) return;

    this.guardando.set(true);
    this.api.crear({ titulo: titulo.trim(), descripcion: descripcion.trim() }).subscribe({
      next: (item) => {
        this.items.update((lista) => [item, ...lista]);
        this.formItem.reset();
        this.errorItems.set('');
        this.guardando.set(false);
      },
      error: (err) => {
        this.errorItems.set(mapearError(err).mensaje);
        this.guardando.set(false);
      },
    });
  }

  protected eliminar(item: Item): void {
    this.api.eliminar(item.id).subscribe({
      next: () => this.items.update((lista) => lista.filter((i) => i.id !== item.id)),
      error: (err) => this.errorItems.set(mapearError(err).mensaje),
    });
  }

  protected preguntar(): void {
    const pregunta = this.formIA.getRawValue().pregunta.trim();
    if (!pregunta || this.pensando()) return;

    this.pensando.set(true);
    this.respuesta.set('');
    this.errorIA.set('');
    this.api.preguntarIA(pregunta).subscribe({
      next: ({ respuesta }) => {
        this.respuesta.set(respuesta);
        this.pensando.set(false);
        this.dictado.agregar('app', 'La IA respondió. La respuesta está bajo la pregunta.');
      },
      error: (err) => {
        const mensaje = mapearError(err).mensaje;
        this.errorIA.set(mensaje);
        this.pensando.set(false);
        this.dictado.agregar('app', mensaje);
      },
    });
  }

  protected salir(): void {
    this.auth.cerrarSesion();
    this.router.navigateByUrl('/login');
  }
}
