import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { APP_NOMBRE } from '../../config';
import { AuthService } from '../../core/auth.service';
import { Avatar } from '../../ui/avatar/avatar';
import { Button } from '../../ui/button/button';
import { Icon } from '../../ui/icon/icon';
import { ThemeToggle } from '../../ui/theme-toggle/theme-toggle';

// La barra de /app y /proyectos: la marca, Mis proyectos, el tema, el usuario y salir.
@Component({
  selector: 'app-barra',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, Avatar, Button, Icon, ThemeToggle],
  templateUrl: './barra.html',
  styleUrl: './barra.css',
})
export class Barra {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  protected readonly nombreApp = APP_NOMBRE;
  protected readonly usuario = this.auth.usuario;

  protected salir(): void {
    this.auth.cerrarSesion();
    void this.router.navigateByUrl('/login');
  }
}
