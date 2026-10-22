import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { prefiereMenosMovimiento } from '../core/movimiento';
import {
  ErrorPagina,
  EventoPagina,
  PaginaFinal,
  PaginasService,
} from '../services/paginas.service';
import { ProyectosService } from '../services/proyectos.service';
import type { Ancho } from '../vista-previa/ventana';
import { documentoVistaPrevia, htmlParaDescargar } from '../vista-previa/sanear';
import { Comando, interpretarComando } from '../voz/comandos';
import { NivelMicrofono } from '../voz/nivel-microfono';
import { VozService } from '../voz/voz.service';
import { Bloque, bloquesCompletos, diffBloques, documentoParcial, nombreDeBloque } from './bloques';
import { Version, agregar, deshacer, puedeDeshacer, puedeRehacer, rehacer } from './versiones';

// Estado de /app: la orden (dictada o escrita), la construcción en vivo, las versiones del
// proyecto, el guardado y los comandos de voz. Se provee en el componente de la página.

export type Fase = 'vacio' | 'pensando' | 'construyendo' | 'listo';

export interface Progreso {
  texto: string; // qué está pasando, en palabras
  bloques: { id: string; nombre: string }[]; // los que ya llegaron
  caracteres: number;
  sinStream: boolean; // se está usando la alternativa sin streaming
  desdeCache: boolean;
}

export interface ErrorEstudio {
  mensaje: string;
  reintentar: boolean; // tiene sentido ofrecer "Reintentar"
}

export const EJEMPLOS = [
  'Una landing para una cafetería en Pasto con menú y contacto',
  'Un portafolio para una fotógrafa con galería y formulario de contacto',
  'La página de una barbería con servicios, precios y horario',
  'Una tienda de artesanías de Nariño con productos destacados',
];

const PROGRESO_VACIO: Progreso = {
  texto: '',
  bloques: [],
  caracteres: 0,
  sinStream: false,
  desdeCache: false,
};
// Al mostrar una página que llegó entera (caché o sin stream), sus bloques aparecen en orden.
const PAUSA_ENTRE_BLOQUES_MS = 220;

const menosMovimiento = () => typeof matchMedia === 'function' && prefiereMenosMovimiento();
const esperar = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function nombreDeProyecto(titulo: string | null, orden: string): string {
  const base = (titulo ?? orden).replace(/\s+/g, ' ').trim();
  return (base.length > 60 ? `${base.slice(0, 59)}…` : base) || 'Página sin nombre';
}

export function nombreDeArchivo(nombre: string): string {
  const slug = nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  return `${slug || 'pagina'}.html`;
}

@Injectable()
export class EstudioEstado {
  private readonly paginas = inject(PaginasService);
  private readonly proyectos = inject(ProyectosService);
  readonly voz = inject(VozService);
  readonly microfono = inject(NivelMicrofono);

  readonly ejemplos = EJEMPLOS;
  readonly orden = signal('');
  readonly fase = signal<Fase>('vacio');
  readonly progreso = signal<Progreso>(PROGRESO_VACIO);
  readonly error = signal<ErrorEstudio | null>(null);
  readonly errorVoz = signal<string | null>(null);
  // Mensaje para role="status": qué cambió, qué se deshizo, si se guardó.
  readonly anuncio = signal('');
  readonly ancho = signal<Ancho>('escritorio');
  // Lo que la IA está haciendo ahora mismo ("generar" una página nueva o "editar" la actual).
  readonly trabajando = signal<'generar' | 'editar' | null>(null);
  readonly ordenEnCurso = signal('');

  readonly proyecto = signal<{ id: number; nombre: string } | null>(null);
  readonly versiones = signal<Version[]>([]);
  readonly actualId = signal<number | null>(null);
  readonly resaltados = signal<string[]>([]);
  readonly guardado = signal<'guardando' | 'guardado' | 'error' | null>(null);

  readonly actual = computed(() => this.versiones().find((v) => v.id === this.actualId()) ?? null);
  readonly puedeDeshacer = computed(() => {
    const id = this.actualId();
    return id !== null && puedeDeshacer(this.versiones(), id);
  });
  readonly puedeRehacer = computed(() => {
    const id = this.actualId();
    return id !== null && puedeRehacer(this.versiones(), id);
  });

  // La página en construcción: el <head> y los bloques que ya llegaron (cambia solo cuando llega
  // un bloque nuevo, no con cada trozo: así el iframe no parpadea).
  private readonly enConstruccion = signal<{ documento: string; nuevos: string[] } | null>(null);

  readonly documento = computed(() => {
    const parcial = this.enConstruccion();
    if (parcial) return documentoVistaPrevia(parcial.documento, { entrando: parcial.nuevos });
    const actual = this.actual();
    return actual ? documentoVistaPrevia(actual.html, { resaltar: this.resaltados() }) : null;
  });

  private ultima: string | null = null; // la última orden enviada, para "Reintentar"
  private temporal = 0; // ids negativos de las versiones aún sin guardar
  private generacion = 0; // sube con "nueva página": descarta lo que llegue de la anterior
  private peticion: AbortController | null = null; // la orden en curso, para cortarla con "nueva"
  private cola: Promise<void> = Promise.resolve(); // los guardados de esta página, uno tras otro

  // ---------- Órdenes ----------

  async enviar(texto = this.orden()): Promise<void> {
    const orden = texto.trim();
    if (!orden || this.trabajando()) return;
    const comando = interpretarComando(orden);
    if (comando) {
      this.orden.set('');
      this.ejecutar(comando);
      return;
    }
    this.ultima = orden;
    await this.pedir(orden);
  }

  async reintentar(): Promise<void> {
    if (this.ultima) await this.pedir(this.ultima);
  }

  ejecutar(comando: Comando): void {
    if (comando === 'deshacer') this.deshacer();
    else if (comando === 'rehacer') this.rehacer();
    else if (comando === 'nueva') this.nueva();
    else this.descargar();
  }

  private async pedir(orden: string): Promise<void> {
    const base = this.actual();
    const modo = base ? 'editar' : 'generar';
    const generacion = this.generacion;
    const peticion = new AbortController();
    this.peticion = peticion;
    this.error.set(null);
    this.trabajando.set(modo);
    this.ordenEnCurso.set(orden);
    this.fase.set(base ? 'construyendo' : 'pensando');
    this.progreso.set({
      ...PROGRESO_VACIO,
      texto: base ? 'Aplicando tu orden…' : 'Pidiendo la página a la IA…',
    });
    let acumulado = '';
    let vistos: Bloque[] = [];
    const alEvento = (e: EventoPagina) => {
      if (generacion !== this.generacion) return;
      if (e.tipo === 'fase') this.progreso.update((p) => ({ ...p, texto: e.texto }));
      else if (e.tipo === 'reintento') {
        acumulado = '';
        vistos = [];
        this.enConstruccion.set(null);
        this.progreso.update((p) => ({
          ...p,
          texto: 'La IA se equivocó; se lo pido de nuevo…',
          bloques: [],
          caracteres: 0,
        }));
      } else if (e.tipo === 'sin-stream') {
        this.progreso.update((p) => ({
          ...p,
          sinStream: true,
          texto: 'Generando la página completa (sin vista en vivo)…',
        }));
      } else if (e.tipo === 'parcial') {
        acumulado += e.trozo;
        this.fase.set('construyendo');
        const bloques = bloquesCompletos(acumulado);
        const llegaron = bloques.length !== vistos.length;
        this.progreso.update((p) => ({
          ...p,
          texto: base ? 'Aplicando tu orden…' : 'Armando la página…',
          caracteres: acumulado.length,
          bloques: llegaron
            ? bloques.map((b) => ({ id: b.id, nombre: nombreDeBloque(b.id, b.etiqueta) }))
            : p.bloques,
        }));
        if (llegaron && !base) {
          const nuevos = bloques.filter((b) => !vistos.some((v) => v.id === b.id)).map((b) => b.id);
          const documento = documentoParcial(acumulado);
          if (documento) this.enConstruccion.set({ documento, nuevos });
        }
        if (llegaron) vistos = bloques;
      }
    };

    try {
      const pagina =
        modo === 'editar'
          ? await this.paginas.editar(base!.html, orden, alEvento, peticion.signal)
          : await this.paginas.generar(orden, alEvento, peticion.signal);
      if (generacion !== this.generacion) return;
      if (!base && (pagina.desdeCache || this.progreso().sinStream)) await this.revelar(pagina);
      this.enConstruccion.set(null);
      await this.agregarVersion(pagina, orden, base);
      this.orden.set('');
      this.fase.set('listo');
    } catch (err) {
      if (generacion !== this.generacion) return;
      this.enConstruccion.set(null);
      this.fase.set(base ? 'listo' : 'vacio');
      const estado = err instanceof ErrorPagina ? err.estado : 500;
      this.error.set({
        mensaje: err instanceof Error ? err.message : 'Algo falló al generar la página.',
        reintentar: estado === 0 || estado >= 500,
      });
    } finally {
      if (this.peticion === peticion) this.peticion = null;
      if (generacion === this.generacion) {
        this.trabajando.set(null);
        this.ordenEnCurso.set('');
      }
    }
  }

  // Una página que llegó entera (de la caché o sin stream) se muestra igual por bloques, en orden.
  private async revelar(pagina: PaginaFinal): Promise<void> {
    const bloques = bloquesCompletos(pagina.html);
    this.progreso.update((p) => ({
      ...p,
      desdeCache: pagina.desdeCache,
      texto: pagina.desdeCache ? 'Desde la caché: armando la página…' : 'Armando la página…',
      caracteres: pagina.html.length,
      bloques: bloques.map((b) => ({ id: b.id, nombre: nombreDeBloque(b.id, b.etiqueta) })),
    }));
    if (menosMovimiento() || !bloques.length) return;
    const cuerpo = pagina.html.search(/<body[^>]*>/i);
    const cabeza = pagina.html.slice(0, pagina.html.indexOf('>', cuerpo) + 1);
    for (let i = 1; i <= bloques.length; i++) {
      const documento = `${cabeza}\n${bloques
        .slice(0, i)
        .map((b) => b.html)
        .join('\n')}\n</body></html>`;
      this.enConstruccion.set({ documento, nuevos: [bloques[i - 1].id] });
      await esperar(PAUSA_ENTRE_BLOQUES_MS);
    }
  }

  // ---------- Versiones ----------

  private async agregarVersion(
    pagina: PaginaFinal,
    orden: string,
    base: Version | null,
  ): Promise<void> {
    const version: Version = {
      id: --this.temporal,
      base_id: base?.id ?? null,
      orden,
      tipo: base ? 'editar' : 'crear',
      html: pagina.html,
      creado_en: new Date().toISOString(),
    };
    if (!this.proyecto() && !base) this.nombrePendiente = nombreDeProyecto(pagina.titulo, orden);
    this.versiones.update((vs) => agregar(vs, version));
    this.mostrar(version.id, base?.html ?? null);
    await this.guardarPendientes();
  }

  private nombrePendiente = '';

  private hayPendientes(): boolean {
    return this.versiones().some((v) => v.id < 0);
  }

  // Guarda en orden las versiones que aún no están en el servidor (ids negativos). Los guardados
  // van en cola: "Reintentar guardar" durante el guardado de una orden no duplica nada.
  guardarPendientes(): Promise<void> {
    const generacion = this.generacion;
    this.cola = this.cola.then(() => this.guardarUnaPasada(generacion));
    return this.cola;
  }

  // Después de cada espera se comprueba que siga siendo la misma página: si se pidió una nueva o
  // se abrió otro proyecto, lo que responda el servidor ya no se mezcla con el estado actual.
  private async guardarUnaPasada(generacion: number): Promise<void> {
    if (generacion !== this.generacion || !this.hayPendientes()) return;
    this.guardado.set('guardando');
    try {
      for (const v of this.versiones().filter((x) => x.id < 0)) {
        const actual = this.versiones().find((x) => x.id === v.id)!;
        let guardada: Version;
        if (!this.proyecto()) {
          const p = await firstValueFrom(
            this.proyectos.crear(this.nombrePendiente || nombreDeProyecto(null, actual.orden), {
              orden: actual.orden,
              tipo: actual.tipo,
              html: actual.html,
            }),
          );
          if (generacion !== this.generacion) return;
          this.proyecto.set({ id: p.id, nombre: p.nombre });
          guardada = p.versiones[0];
        } else {
          guardada = await firstValueFrom(
            this.proyectos.agregarVersion(this.proyecto()!.id, {
              base_id: actual.base_id,
              orden: actual.orden,
              tipo: actual.tipo,
              html: actual.html,
            }),
          );
          if (generacion !== this.generacion) return;
        }
        this.reemplazarId(v.id, guardada.id);
      }
      this.guardado.set('guardado');
    } catch {
      if (generacion === this.generacion) this.guardado.set('error');
    }
  }

  private reemplazarId(viejo: number, nuevo: number): void {
    this.versiones.update((vs) =>
      vs.map((v) => ({
        ...v,
        id: v.id === viejo ? nuevo : v.id,
        base_id: v.base_id === viejo ? nuevo : v.base_id,
      })),
    );
    if (this.actualId() === viejo) this.actualId.set(nuevo);
  }

  // Muestra una versión y resalta lo que cambió respecto de la que se veía.
  private mostrar(id: number, antes: string | null, aviso?: string): void {
    const destino = this.versiones().find((v) => v.id === id);
    if (!destino) return;
    this.actualId.set(id);
    if (antes === null) {
      this.resaltados.set([]);
      this.anuncio.set(aviso ?? 'Página lista.');
      return;
    }
    const d = diffBloques(antes, destino.html);
    this.resaltados.set([...d.cambiados, ...d.nuevos]);
    const nombre = (bid: string) => nombreDeBloque(bid);
    const partes = [
      ...d.cambiados.map(nombre),
      ...d.nuevos.map((bid) => `${nombre(bid)} (nuevo)`),
      ...d.quitados.map((bid) => `${nombre(bid)} (quitado)`),
    ];
    if (d.estilos && !partes.length) partes.push('estilos generales');
    const cambio = partes.length ? `Cambió: ${partes.join(', ')}.` : 'La página quedó igual.';
    this.anuncio.set(aviso ? `${aviso} ${cambio}` : cambio);
  }

  private numeroDe(id: number): number {
    return this.versiones().findIndex((v) => v.id === id) + 1;
  }

  deshacer(): void {
    const id = this.actualId();
    const destino = id === null ? null : deshacer(this.versiones(), id);
    if (destino === null) {
      this.anuncio.set('No hay nada que deshacer.');
      return;
    }
    this.mostrar(
      destino,
      this.actual()!.html,
      `Deshecho: volviste a la versión ${this.numeroDe(destino)}.`,
    );
  }

  rehacer(): void {
    const id = this.actualId();
    const destino = id === null ? null : rehacer(this.versiones(), id);
    if (destino === null) {
      this.anuncio.set('No hay nada que rehacer.');
      return;
    }
    this.mostrar(destino, this.actual()!.html, `Rehecho: versión ${this.numeroDe(destino)}.`);
  }

  irA(id: number): void {
    if (id === this.actualId()) return;
    this.mostrar(id, this.actual()?.html ?? null, `Versión ${this.numeroDe(id)}.`);
  }

  // ---------- Proyecto ----------

  // Se puede reemplazar en las pruebas.
  confirmar(mensaje: string): boolean {
    return typeof confirm !== 'function' || confirm(mensaje);
  }

  // Devuelve false si la persona prefirió no descartar versiones sin guardar.
  nueva(): boolean {
    if (
      this.hayPendientes() &&
      !this.confirmar(
        'Hay versiones sin guardar en el servidor. Si sigues, se pierden. ¿Quieres continuar?',
      )
    ) {
      return false;
    }
    this.generacion++;
    this.peticion?.abort();
    this.peticion = null;
    this.cola = Promise.resolve();
    this.proyecto.set(null);
    this.versiones.set([]);
    this.actualId.set(null);
    this.resaltados.set([]);
    this.enConstruccion.set(null);
    this.progreso.set(PROGRESO_VACIO);
    this.error.set(null);
    this.guardado.set(null);
    this.trabajando.set(null);
    this.orden.set('');
    this.nombrePendiente = '';
    this.fase.set('vacio');
    this.anuncio.set('Página nueva: dime qué quieres crear.');
    return true;
  }

  async cargar(id: number): Promise<void> {
    if (!this.nueva()) return;
    const generacion = this.generacion;
    this.fase.set('pensando');
    this.progreso.set({ ...PROGRESO_VACIO, texto: 'Abriendo el proyecto…' });
    try {
      const p = await firstValueFrom(this.proyectos.obtener(id));
      if (generacion !== this.generacion) return;
      this.proyecto.set({ id: p.id, nombre: p.nombre });
      this.versiones.set(p.versiones);
      const ultima = p.versiones.at(-1);
      this.actualId.set(ultima?.id ?? null);
      this.fase.set(ultima ? 'listo' : 'vacio');
      this.guardado.set('guardado');
      this.anuncio.set(
        `Abriste «${p.nombre}», con ${p.versiones.length} ${p.versiones.length === 1 ? 'versión' : 'versiones'}.`,
      );
    } catch {
      if (generacion !== this.generacion) return;
      this.fase.set('vacio');
      this.error.set({
        mensaje: 'No se pudo abrir el proyecto. Puede que ya no exista.',
        reintentar: false,
      });
    }
  }

  // ---------- Descargar y copiar ----------

  descargar(): void {
    const actual = this.actual();
    if (!actual) {
      this.anuncio.set('Todavía no hay una página para descargar.');
      return;
    }
    const nombre = nombreDeArchivo(this.proyecto()?.nombre ?? this.nombrePendiente);
    this.descargarArchivo(nombre, htmlParaDescargar(actual.html));
    this.anuncio.set(`Descargada como ${nombre}.`);
  }

  // Se puede reemplazar en las pruebas.
  descargarArchivo(nombre: string, contenido: string): void {
    const url = URL.createObjectURL(new Blob([contenido], { type: 'text/html;charset=utf-8' }));
    const enlace = Object.assign(document.createElement('a'), { href: url, download: nombre });
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async copiar(): Promise<void> {
    const actual = this.actual();
    if (!actual) return;
    try {
      await navigator.clipboard.writeText(htmlParaDescargar(actual.html));
      this.anuncio.set('Código copiado al portapapeles.');
    } catch {
      this.anuncio.set('No se pudo copiar. Descarga la página en su lugar.');
    }
  }

  // ---------- Voz ----------

  // Dictar una orden: se mide el volumen real mientras se escucha. Lo dictado queda en el campo
  // para revisarlo antes de enviar; un comando ("deshacer") se ejecuta enseguida.
  async dictar(): Promise<void> {
    if (this.voz.escuchando()) {
      this.voz.detener();
      return;
    }
    this.errorVoz.set(null);
    void this.microfono.abrir().catch(() => {
      // Sin visualización se dicta igual; si tampoco hay permiso, lo dirá el reconocimiento.
    });
    try {
      const texto = await this.voz.escucharOrden();
      const comando = interpretarComando(texto);
      if (comando) this.ejecutar(comando);
      else this.orden.set(texto);
    } catch (err) {
      this.errorVoz.set(
        err instanceof Error ? err.message : 'No se pudo dictar. Escribe la orden.',
      );
    } finally {
      this.microfono.cerrar();
    }
  }
}
