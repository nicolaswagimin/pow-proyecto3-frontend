// Comandos de control por voz: se resuelven en el navegador, sin IA (no gastan cuota). Solo cuenta
// la frase completa, para que "deshacer el cambio del título y ponerlo verde" siga siendo una orden
// de edición. Ver docs/voz.md.

export type Comando = 'deshacer' | 'rehacer' | 'nueva' | 'descargar';

const FRASES: Record<Comando, string[]> = {
  deshacer: [
    'deshacer',
    'deshaz',
    'deshaz eso',
    'deshacer eso',
    'deshacer el ultimo cambio',
    'deshaz el ultimo cambio',
    'vuelve atras',
    'volver atras',
    'atras',
  ],
  rehacer: ['rehacer', 'rehaz', 'rehaz eso', 'rehacer eso', 'vuelve adelante', 'adelante'],
  nueva: [
    'nueva pagina',
    'pagina nueva',
    'empezar de nuevo',
    'empieza de nuevo',
    'nuevo proyecto',
    'otra pagina',
  ],
  descargar: [
    'descargar',
    'descarga',
    'descargala',
    'descargar la pagina',
    'descarga la pagina',
    'bajala',
    'baja la pagina',
    'bajar la pagina',
  ],
};

// Sin mayúsculas, tildes ni puntuación, y sin cortesías alrededor.
function normalizar(texto: string): string {
  return texto
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zñ\s]/g, ' ')
    .replace(/\b(por favor|porfa|oye|ahora)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const INDICE = new Map<string, Comando>(
  (Object.entries(FRASES) as [Comando, string[]][]).flatMap(([c, frases]) =>
    frases.map((f) => [f, c] as const),
  ),
);

export function interpretarComando(texto: string): Comando | null {
  return INDICE.get(normalizar(texto)) ?? null;
}
