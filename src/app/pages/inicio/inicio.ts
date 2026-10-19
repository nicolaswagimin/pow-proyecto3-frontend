import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { APP_NOMBRE } from '../../config';
import { AuthService } from '../../core/auth.service';
import { Construccion } from '../../estudio/componentes/construccion';
import { Ejemplos } from '../../estudio/componentes/ejemplos';
import { LineaTiempo } from '../../estudio/componentes/linea-tiempo';
import { Microfono } from '../../estudio/componentes/microfono';
import { Orden } from '../../estudio/componentes/orden';
import { EstudioEstado } from '../../estudio/estudio-estado';
import { Barra } from '../../layouts/barra/barra';
import { Alert } from '../../ui/alert/alert';
import { Button } from '../../ui/button/button';
import { Icon } from '../../ui/icon/icon';
import { Ventana } from '../../vista-previa/ventana';
import { NivelMicrofono } from '../../voz/nivel-microfono';

// /app: describe la página en voz alta (o escríbela), mírala armarse en la ventana de navegador y
// cámbiala con nuevas órdenes. Versiones con deshacer y rehacer, guardado automático, descargar y
// copiar. Ver docs/funcionalidades.md.
@Component({
  selector: 'app-inicio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Barra,
    Alert,
    Button,
    Icon,
    Microfono,
    Orden,
    Ejemplos,
    Ventana,
    Construccion,
    LineaTiempo,
  ],
  providers: [EstudioEstado, NivelMicrofono],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {
  protected readonly estado = inject(EstudioEstado);
  protected readonly voz = this.estado.voz;
  protected readonly nivel = this.estado.microfono.nivel;
  private readonly auth = inject(AuthService);

  protected readonly primerNombre = computed(
    () => (this.auth.usuario()?.nombre ?? '').trim().split(/\s+/)[0] || '',
  );
  protected readonly enEstudio = computed(
    () => this.estado.fase() !== 'vacio' || this.estado.versiones().length > 0,
  );
  protected readonly nombre = computed(() => this.estado.proyecto()?.nombre ?? 'Página nueva');
  protected readonly textoGuardado = computed(() => {
    const g = this.estado.guardado();
    return g === 'guardando'
      ? 'Guardando…'
      : g === 'guardado'
        ? 'Guardado'
        : g === 'error'
          ? 'Sin guardar'
          : '';
  });

  constructor() {
    inject(Title).setTitle(`Estudio · ${APP_NOMBRE}`);
    this.auth.refrescarUsuario();
    // /app?proyecto=<id> abre un proyecto guardado (desde /proyectos).
    const id = Number(inject(ActivatedRoute).snapshot.queryParamMap.get('proyecto'));
    if (Number.isInteger(id) && id > 0) void this.estado.cargar(id);
  }

  protected probar(frase: string): void {
    this.estado.orden.set(frase);
    void this.estado.enviar(frase);
  }
}
