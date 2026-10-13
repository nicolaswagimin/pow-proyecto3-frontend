import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { APP_NOMBRE } from '../../config';
import { ThemeToggle } from '../../ui/theme-toggle/theme-toggle';

// Plantilla de acceso: del guion a la maqueta. A la izquierda, lo que se dictó; a la derecha, la
// página que se arma con eso. En móvil el guion va arriba del formulario.
@Component({
  selector: 'app-auth-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ThemeToggle],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.css',
})
export class AuthLayout {
  protected readonly nombreApp = APP_NOMBRE;
}
