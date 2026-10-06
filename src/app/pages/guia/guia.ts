import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { APP_NOMBRE } from '../../config';
import { leerToken } from '../../core/movimiento';
import { Estallido } from '../../fx/estallido/estallido';
import { Cielo } from '../../fx/cielo/cielo';
import { Alert } from '../../ui/alert/alert';
import { Avatar } from '../../ui/avatar/avatar';
import { Button } from '../../ui/button/button';
import { Icon, NombreIcono } from '../../ui/icon/icon';
import { PasswordField } from '../../ui/password-field/password-field';
import { TextField } from '../../ui/text-field/text-field';
import { ThemeToggle } from '../../ui/theme-toggle/theme-toggle';

const COLORES = [
  '--color-fondo',
  '--color-superficie',
  '--color-texto',
  '--color-texto-suave',
  '--color-borde',
  '--color-primario-1',
  '--color-primario-2',
  '--color-primario-contraste',
  '--color-enlace',
  '--color-acento',
  '--color-error',
  '--color-exito',
  '--color-aviso',
  '--color-foco',
  '--cielo-alto',
  '--duna-2',
];

// Guía de estilo viva: tokens y cada componente en todos sus estados. No se enlaza desde la app.
@Component({
  selector: 'app-guia',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    Cielo,
    Estallido,
    Alert,
    Avatar,
    Button,
    Icon,
    PasswordField,
    TextField,
    ThemeToggle,
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

  protected readonly vacio = new FormControl('', { nonNullable: true });
  protected readonly conValor = new FormControl('ana@ejemplo.com', { nonNullable: true });
  protected readonly conError = new FormControl('ana@', { nonNullable: true });
  protected readonly deshabilitado = new FormControl(
    { value: 'No editable', disabled: true },
    { nonNullable: true },
  );
  protected readonly clave = new FormControl('Atardecer2026!', { nonNullable: true });
  protected readonly cargando = signal(false);

  private readonly muestra = viewChild.required<ElementRef<HTMLElement>>('muestra');
  private readonly celebracion = viewChild.required(Estallido);

  constructor() {
    inject(Title).setTitle(`Guía de diseño · ${APP_NOMBRE}`);
    afterNextRender(() => this.leerColores());
  }

  // El tema cambia dentro de una View Transition: se espera un momento antes de releer los tokens.
  protected releerColores(): void {
    setTimeout(() => this.leerColores(), 150);
  }

  private leerColores(): void {
    this.colores.set(COLORES.map((nombre) => ({ nombre, valor: leerToken(nombre) })));
  }

  protected demoCarga(): void {
    this.cargando.set(true);
    setTimeout(() => this.cargando.set(false), 2200);
  }

  protected demoSacudida(): void {
    this.muestra().nativeElement.animate(
      [
        { transform: 'none' },
        { transform: 'translateX(-10px) skewX(8deg)', filter: 'blur(1.5px)' },
        { transform: 'translateX(9px) skewX(-6deg)', filter: 'blur(0.5px)' },
        { transform: 'translateX(-6px) skewX(4deg)', filter: 'blur(1px)' },
        { transform: 'none', filter: 'blur(0)' },
      ],
      { duration: 520, easing: 'ease-out' },
    );
  }

  protected demoCelebracion(evento: MouseEvent): void {
    const caja = this.muestra().nativeElement.getBoundingClientRect();
    this.celebracion().lanzar(
      { x: evento.clientX, y: evento.clientY },
      { x: caja.left + caja.width / 2, y: caja.top + caja.height / 2 },
    );
  }
}
