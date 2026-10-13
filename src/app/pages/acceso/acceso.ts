import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { APP_NOMBRE } from '../../config';
import { AuthService } from '../../core/auth.service';
import { CampoAuth, ErrorInterfaz, mapearError } from '../../core/errores';
import { AuthLayout } from '../../layouts/auth-layout/auth-layout';
import { Alert } from '../../ui/alert/alert';
import { Icon } from '../../ui/icon/icon';
import { correoHablado } from '../../voz/correo-hablado';
import { Dictado, Frase } from '../../voz/dictado';
import { Transcripcion } from '../../voz/transcripcion';
import { VozService } from '../../voz/voz.service';
import { Button } from '../../ui/button/button';
import { PasswordField } from '../../ui/password-field/password-field';
import { TextField } from '../../ui/text-field/text-field';

export type Modo = 'login' | 'registro';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TEXTOS = {
  login: {
    titulo: 'Inicia sesión',
    subtitulo: 'Esta página se arma con lo que se dicta en el guion.',
    boton: 'Iniciar sesión',
    cargando: 'Iniciando sesión…',
    pregunta: '¿No tienes cuenta?',
    enlace: '/registro',
    enlaceTexto: 'Crea una',
    exito: 'Sesión iniciada. Entrando…',
  },
  registro: {
    titulo: 'Crea tu cuenta',
    subtitulo: 'El campo del nombre se agregó por dictado.',
    boton: 'Crear cuenta',
    cargando: 'Creando tu cuenta…',
    pregunta: '¿Ya tienes cuenta?',
    enlace: '/login',
    enlaceTexto: 'Inicia sesión',
    exito: 'Cuenta creada. Entrando…',
  },
} as const;

// El guion que se dicta al abrir el acceso: cada frase ensambla un bloque de la página.
const GUIONES: Record<Modo, Frase[]> = {
  login: [
    { texto: 'Quiero una página para entrar a mi cuenta,', bloque: 'titulo' },
    { texto: 'con un campo para mi correo', bloque: 'correo' },
    { texto: 'y otro para la contraseña.', bloque: 'contrasena' },
    { texto: 'Abajo, un botón para entrar', bloque: 'boton' },
    { texto: 'y un enlace para crear una cuenta.', bloque: 'enlace' },
  ],
  registro: [
    { texto: 'Quiero una página para crear mi cuenta,', bloque: 'titulo' },
    { texto: 'con mi nombre,', bloque: 'nombre' },
    { texto: 'mi correo', bloque: 'correo' },
    { texto: 'y una contraseña.', bloque: 'contrasena' },
    { texto: 'Abajo, un botón para crearla', bloque: 'boton' },
    { texto: 'y un enlace por si ya tengo cuenta.', bloque: 'enlace' },
  ],
};

// Lo que se dicta al cambiar de modo: la página se edita por voz.
const CAMBIOS: Record<Modo, Frase> = {
  registro: { texto: 'Agrega un campo para el nombre.', bloque: 'nombre' },
  login: { texto: 'Quita el nombre: ya tengo cuenta.' },
};

const NOMBRES_CAMPO: Record<CampoAuth, string> = {
  nombre: 'Nombre',
  email: 'Correo',
  password: 'Contraseña',
};

function noVacio(control: AbstractControl<string>): ValidationErrors | null {
  return control.value.trim() ? null : { required: true };
}

// Login y registro son el mismo componente: así el cambio entre ambos es una transición, no una recarga.
@Component({
  selector: 'app-acceso',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthLayout,
    Alert,
    Button,
    Icon,
    TextField,
    PasswordField,
    Transcripcion,
  ],
  templateUrl: './acceso.html',
  styleUrl: './acceso.css',
})
export class Acceso {
  // Vienen de la URL: /login o /registro, y ?sesion=expirada.
  readonly modo = input<string>('login');
  readonly sesion = input<string | undefined>();

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly titulo = inject(Title);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly form = this.fb.group({
    nombre: ['', [noVacio, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.pattern(EMAIL_VALIDO), Validators.maxLength(255)]],
    password: ['', [Validators.required]],
  });

  protected readonly modoVisible = signal<Modo>('login');
  protected readonly textos = computed(() => TEXTOS[this.modoVisible()]);
  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly servidorLento = signal(false);
  protected readonly errorGeneral = signal<ErrorInterfaz | null>(null);
  protected readonly anuncio = signal('');
  protected readonly sesionExpirada = computed(
    () => this.sesion() === 'expirada' && this.modoVisible() === 'login',
  );
  // Cualquier cambio del formulario (valor, estado, tocado) vuelve a evaluar los mensajes.
  private readonly eventosForm = toSignal(this.form.events);

  private readonly encabezado = viewChild.required<ElementRef<HTMLElement>>('encabezado');
  private readonly campoNombre = viewChild<TextField>('campoNombre');
  private readonly campoEmail = viewChild.required<TextField>('campoEmail');
  private readonly campoPassword = viewChild.required(PasswordField);

  private primeraVez = true;
  protected readonly dictado = new Dictado();
  protected readonly voz = inject(VozService);
  // Mientras la persona dicta, su línea del guion muestra el texto interino del reconocedor.
  private readonly idEnVivo = signal<number | null>(null);
  protected readonly lineas = computed(() =>
    this.dictado
      .lineas()
      .map((linea) =>
        linea.id === this.idEnVivo() ? { ...linea, interino: this.voz.interino() || '…' } : linea,
      ),
  );
  protected readonly subtitulo = computed(() =>
    this.voz.disponible && this.modoVisible() === 'login'
      ? `${this.textos().subtitulo} También puedes dictar tu correo.`
      : this.textos().subtitulo,
  );

  constructor() {
    inject(DestroyRef).onDestroy(() => this.dictado.detener());
    effect(() => {
      const modo: Modo = this.modo() === 'registro' ? 'registro' : 'login';
      untracked(() => this.cambiarModo(modo));
    });
  }

  protected errorDe(campo: CampoAuth): string | null {
    this.eventosForm();
    const control = this.form.controls[campo];
    if (control.disabled || control.valid || !(control.touched || this.enviado())) return null;
    const errores = control.errors ?? {};
    if (errores['servidor']) return errores['servidor'];
    switch (campo) {
      case 'nombre':
        return errores['maxlength']
          ? 'El nombre no puede superar los 100 caracteres.'
          : 'Escribe tu nombre.';
      case 'email':
        return errores['required']
          ? 'Escribe tu correo.'
          : 'Escribe un correo válido, como nombre@dominio.com.';
      case 'password':
        if (errores['required']) return 'Escribe tu contraseña.';
        if (errores['maxlength']) return 'La contraseña no puede superar los 72 caracteres.';
        return 'La contraseña necesita al menos 8 caracteres.';
    }
  }

  // Dictar el correo: el micrófono se abre, la frase aparece en el guion mientras se reconoce y,
  // al confirmarse, se convierte en un correo escrito y llena el campo. El teclado siempre sirve.
  protected async dictarCorreo(): Promise<void> {
    if (this.voz.escuchando()) {
      this.voz.detener();
      return;
    }
    this.dictado.saltar();
    const id = this.dictado.agregar('tu');
    this.idEnVivo.set(id);
    this.anunciar('Escuchando. Di tu correo, por ejemplo: ana arroba correo punto com.');
    try {
      const dicho = await this.voz.dictar();
      const correo = correoHablado(dicho);
      this.dictado.actualizar(id, { texto: dicho });
      this.dictado.agregar('app', `Correo: ${correo}`);
      const control = this.form.controls.email;
      control.setValue(correo);
      control.markAsTouched();
      this.anunciar(`Correo dictado: ${correo}. Revísalo antes de continuar.`);
    } catch (e) {
      this.dictado.quitar(id);
      const mensaje = e instanceof Error ? e.message : 'No se pudo dictar. Escribe con el teclado.';
      this.dictado.agregar('app', mensaje);
      this.anunciar(mensaje);
    } finally {
      this.idEnVivo.set(null);
      this.campoEmail().enfocar();
    }
  }

  protected repetir(): void {
    this.dictado.reiniciar();
    this.dictado.reproducir(GUIONES[this.modoVisible()]);
  }

  protected enviar(): void {
    if (this.enviando()) return;
    this.enviado.set(true);
    this.errorGeneral.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const invalidos = (['nombre', 'email', 'password'] as const).filter(
        (campo) => this.form.controls[campo].enabled && this.form.controls[campo].invalid,
      );
      this.anunciar(
        `Revisa ${invalidos.length === 1 ? 'el campo' : 'los campos'}: ${invalidos.map((c) => NOMBRES_CAMPO[c]).join(', ')}.`,
      );
      this.enfocarCampo(invalidos[0]);
      return;
    }

    const modo = this.modoVisible();
    const { nombre, email, password } = this.form.getRawValue();
    const peticion: Observable<unknown> =
      modo === 'login'
        ? this.auth.login(email.trim(), password)
        : this.auth.registrar(nombre.trim(), email.trim(), password);

    this.enviando.set(true);
    // El backend gratuito de Render se duerme: si tarda, se avisa en lugar de dejar a la persona esperando a ciegas.
    const avisoLento = setTimeout(() => this.servidorLento.set(true), 4000);

    peticion.subscribe({
      next: async () => {
        clearTimeout(avisoLento);
        this.servidorLento.set(false);
        this.anunciar(TEXTOS[modo].exito);
        this.dictado.agregar('app', TEXTOS[modo].exito);
        await this.router.navigateByUrl('/app');
      },
      error: (err: unknown) => {
        clearTimeout(avisoLento);
        this.servidorLento.set(false);
        this.enviando.set(false);
        const error = mapearError(err, modo);
        // La respuesta también queda en el guion, como la contestación de la app.
        this.dictado.agregar('app', error.mensaje);
        if (error.campo && !error.accion) {
          this.form.controls[error.campo].setErrors({ servidor: error.mensaje });
          this.enfocarCampo(error.campo);
          this.anunciar(error.mensaje);
        } else {
          this.errorGeneral.set(error);
        }
      },
    });
  }

  private cambiarModo(modo: Modo): void {
    if (this.primeraVez) {
      this.primeraVez = false;
      this.aplicarModo(modo);
      this.dictado.reproducir(GUIONES[modo]);
      return;
    }
    if (modo === this.modoVisible()) return;
    this.dictado.reproducir([CAMBIOS[modo]]);
    this.aplicarModo(modo);
    // El foco va al título, salvo que la persona ya haya empezado a escribir en un campo.
    const activo = document.activeElement;
    if (!(activo instanceof HTMLInputElement || activo instanceof HTMLTextAreaElement)) {
      queueMicrotask(() => this.encabezado().nativeElement.focus());
    }
  }

  private aplicarModo(modo: Modo): void {
    this.modoVisible.set(modo);
    this.enviado.set(false);
    this.errorGeneral.set(null);
    this.anuncio.set('');

    const { nombre, password } = this.form.controls;
    if (modo === 'registro') {
      nombre.enable();
      password.setValidators([
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(72),
      ]);
    } else {
      nombre.disable();
      password.setValidators([Validators.required]);
    }
    password.updateValueAndValidity();
    // Al cambiar de modo se conservan los datos escritos, pero sin errores a la vista.
    this.form.markAsUntouched();
    this.titulo.setTitle(`${TEXTOS[modo].boton} · ${APP_NOMBRE}`);
  }

  private enfocarCampo(campo: CampoAuth | undefined): void {
    if (campo === 'nombre') this.campoNombre()?.enfocar();
    else if (campo === 'email') this.campoEmail().enfocar();
    else if (campo === 'password') this.campoPassword().enfocar();
  }

  // Vacía y vuelve a escribir el anuncio para que el lector de pantalla lo repita aunque sea igual.
  private anunciar(mensaje: string): void {
    this.anuncio.set('');
    setTimeout(() => this.anuncio.set(mensaje), 50);
  }
}
