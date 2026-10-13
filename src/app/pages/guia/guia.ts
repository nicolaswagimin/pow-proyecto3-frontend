import { ChangeDetectionStrategy, Component, afterNextRender, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { APP_NOMBRE } from '../../config';
import { leerToken } from '../../core/movimiento';
import { Alert } from '../../ui/alert/alert';
import { Avatar } from '../../ui/avatar/avatar';
import { Button } from '../../ui/button/button';
import { Icon, NombreIcono } from '../../ui/icon/icon';
import { PasswordField } from '../../ui/password-field/password-field';
import { TextField } from '../../ui/text-field/text-field';
import { ThemeToggle } from '../../ui/theme-toggle/theme-toggle';
import { LineaTranscripcion, Transcripcion } from '../../voz/transcripcion';

const COLORES = [
  '--color-fondo',
  '--color-superficie',
  '--color-texto',
  '--color-texto-suave',
  '--color-interino',
  '--color-borde',
  '--color-maqueta',
  '--color-primario',
  '--color-primario-contraste',
  '--color-rec',
  '--color-error',
  '--color-exito',
  '--color-aviso',
  '--color-foco',
];

// Una transcripción con cada tipo de línea: lo confirmado, lo interino y la respuesta de la app.
const LINEAS: LineaTranscripcion[] = [
  { id: 1, quien: 'tu', texto: 'Quiero una página con un formulario de contacto' },
  { id: 2, quien: 'tu', texto: 'y un título', interino: 'en azul' },
  { id: 3, quien: 'app', texto: 'Listo: título y formulario de contacto.' },
];

// Guía de estilo viva: tokens, notación y cada componente en todos sus estados. No se enlaza desde la app.
@Component({
  selector: 'app-guia',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    Alert,
    Avatar,
    Button,
    Icon,
    PasswordField,
    TextField,
    ThemeToggle,
    Transcripcion,
  ],
  templateUrl: './guia.html',
  styleUrl: './guia.css',
})
export class Guia {
  protected readonly nombreApp = APP_NOMBRE;
  protected readonly colores = signal(COLORES.map((nombre) => ({ nombre, valor: '' })));
  protected readonly escala = [
    '--text-3xl',
    '--text-2xl',
    '--text-xl',
    '--text-lg',
    '--text-base',
    '--text-sm',
    '--text-xs',
  ];
  protected readonly iconos: NombreIcono[] = [
    'correo',
    'candado',
    'usuario',
    'alerta',
    'check',
    'info',
    'salir',
    'chispa',
    'papelera',
    'recargar',
    'mas',
    'mayus',
  ];
  protected readonly lineas = LINEAS;
  // El bloque de muestra se puede desarmar y volver a ensamblar.
  protected readonly ensamblado = signal(true);

  protected readonly vacio = new FormControl('', { nonNullable: true });
  protected readonly conValor = new FormControl('ana@ejemplo.com', { nonNullable: true });
  protected readonly conError = new FormControl('ana@', { nonNullable: true });
  protected readonly deshabilitado = new FormControl(
    { value: 'No editable', disabled: true },
    { nonNullable: true },
  );
  protected readonly clave = new FormControl('Dictado2026!', { nonNullable: true });
  protected readonly cargando = signal(false);

  constructor() {
    inject(Title).setTitle(`Guía de diseño · ${APP_NOMBRE}`);
    afterNextRender(() => this.leerColores());
  }

  // El tema cambia dentro de una View Transition: se espera un momento antes de releer los tokens.
  protected releerColores(): void {
    setTimeout(() => this.leerColores(), 300);
  }

  private leerColores(): void {
    this.colores.set(COLORES.map((nombre) => ({ nombre, valor: leerToken(nombre) })));
  }

  protected demoCarga(): void {
    this.cargando.set(true);
    setTimeout(() => this.cargando.set(false), 2200);
  }

  protected demoEnsamblar(): void {
    this.ensamblado.set(false);
    setTimeout(() => this.ensamblado.set(true), 700);
  }
}
