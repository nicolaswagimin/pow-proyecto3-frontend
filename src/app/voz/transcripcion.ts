import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

export interface LineaTranscripcion {
  id: number;
  quien: 'tu' | 'app';
  texto: string; // lo ya confirmado
  interino?: string; // lo que el reconocedor todavía puede cambiar
}

// La transcripción como un guion: lo dicho en Newsreader; el texto interino, en gris e itálica,
// asienta en tinta cuando se confirma. El piloto REC solo se enciende con el micrófono abierto.
@Component({
  selector: 'ui-transcripcion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cabecera">
      <h2 class="titulo" [id]="idTitulo">Transcripción</h2>
      @if (escuchando()) {
        <span class="rec" [class.rec--voz]="oyendoVoz()">
          <span class="rec__piloto" aria-hidden="true"></span>
          REC
        </span>
      }
    </div>
    <div class="lineas">
      @for (linea of lineas(); track linea.id) {
        <p class="linea" [class.linea--app]="linea.quien === 'app'">
          <span class="quien">{{ linea.quien === 'tu' ? 'Tú' : 'VoiceToWeb' }}</span>
          <!-- prettier-ignore -->
          <span class="dicho">{{ linea.texto }}@if (linea.interino) {<span class="interino">{{ (linea.texto ? ' ' : '') + linea.interino }}</span>}</span>
        </p>
      } @empty {
        <p class="vacio">{{ vacio() }}</p>
      }
    </div>
  `,
  styleUrl: './transcripcion.css',
})
export class Transcripcion {
  readonly lineas = input.required<LineaTranscripcion[]>();
  readonly escuchando = input(false, { transform: booleanAttribute });
  readonly oyendoVoz = input(false, { transform: booleanAttribute });
  readonly vacio = input('Todavía no hay nada dictado.');

  protected readonly idTitulo = `transcripcion-${Math.random().toString(36).slice(2, 8)}`;
}
