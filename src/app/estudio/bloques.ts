// Los bloques de una página: los elementos de primer nivel del <body> con data-vtw (el prompt los
// pide). Sirven para armar la página en vivo mientras llega de Gemini (solo se muestra un bloque
// cuando ya cerró) y para resaltar qué cambió entre dos versiones. Ver docs/funcionalidades.md.

export interface Bloque {
  id: string;
  etiqueta: string;
  html: string;
}

// Etiqueta de apertura o cierre, con atributos entre comillas que pueden traer ">".
const ETIQUETA = /<(\/?)([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
const VACIOS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
]);
// Su contenido es texto: un "<div>" dentro de un <style> no es una etiqueta.
const TEXTO_CRUDO = new Set(['style', 'script', 'textarea', 'title']);

function inicioDelCuerpo(html: string): number {
  const m = /<body[^>]*>/i.exec(html);
  return m ? m.index + m[0].length : -1;
}

function atributo(atributos: string, nombre: string): string | null {
  const m = new RegExp(`\\s${nombre}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(
    atributos,
  );
  return m ? (m[2] ?? m[3] ?? m[4] ?? '') : null;
}

// Los bloques de primer nivel que ya cerraron, en orden. Funciona con HTML a medio llegar.
export function bloquesCompletos(html: string): Bloque[] {
  const cuerpo = inicioDelCuerpo(html);
  if (cuerpo === -1) return [];
  const bloques: Bloque[] = [];
  const pila: string[] = [];
  let actual: { id: string | null; etiqueta: string; inicio: number } | null = null;
  ETIQUETA.lastIndex = cuerpo;
  let m: RegExpExecArray | null;
  while ((m = ETIQUETA.exec(html))) {
    // Comentarios: se saltan enteros.
    const antes = html.lastIndexOf('<!--', m.index);
    if (antes !== -1 && antes >= cuerpo && html.indexOf('-->', antes) > m.index) {
      const fin = html.indexOf('-->', antes);
      ETIQUETA.lastIndex = fin + 3;
      continue;
    }
    const [texto, cierre, nombreCrudo, atributos] = m;
    const nombre = nombreCrudo.toLowerCase();
    if (!cierre) {
      if (TEXTO_CRUDO.has(nombre)) {
        const fin = html.toLowerCase().indexOf(`</${nombre}`, m.index + texto.length);
        if (fin === -1) break; // todavía no llegó el cierre
        ETIQUETA.lastIndex = fin;
        if (!pila.length)
          actual = { id: atributo(atributos, 'data-vtw'), etiqueta: nombre, inicio: m.index };
        pila.push(nombre);
        continue;
      }
      if (VACIOS.has(nombre) || atributos.trimEnd().endsWith('/')) {
        if (!pila.length) {
          const id = atributo(atributos, 'data-vtw');
          if (id) bloques.push({ id, etiqueta: nombre, html: texto });
        }
        continue;
      }
      if (!pila.length)
        actual = { id: atributo(atributos, 'data-vtw'), etiqueta: nombre, inicio: m.index };
      pila.push(nombre);
      continue;
    }
    if (nombre === 'body') break;
    // Cierre: se tolera HTML imperfecto cerrando hasta la etiqueta que coincide.
    const i = pila.lastIndexOf(nombre);
    if (i === -1) continue;
    pila.length = i;
    if (!pila.length && actual) {
      if (actual.id) {
        bloques.push({
          id: actual.id,
          etiqueta: actual.etiqueta,
          html: html.slice(actual.inicio, m.index + texto.length),
        });
      }
      actual = null;
    }
  }
  return bloques;
}

// Un documento que se puede mostrar mientras la página sigue llegando: el <head> y los bloques que
// ya cerraron. null si el <body> todavía no empezó.
export function documentoParcial(html: string): string | null {
  const cuerpo = inicioDelCuerpo(html);
  if (cuerpo === -1) return null;
  const bloques = bloquesCompletos(html)
    .map((b) => b.html)
    .join('\n');
  return `${html.slice(0, cuerpo)}\n${bloques}\n</body>\n</html>`;
}

export interface Diferencias {
  cambiados: string[];
  nuevos: string[];
  quitados: string[];
  estilos?: true; // cambió el <head> (los estilos generales)
}

// Qué bloques cambió una orden: se comparan por su data-vtw.
export function diffBloques(antes: string, despues: string): Diferencias {
  const a = new Map(bloquesCompletos(antes).map((b) => [b.id, b.html]));
  const d = new Map(bloquesCompletos(despues).map((b) => [b.id, b.html]));
  const diferencias: Diferencias = {
    cambiados: [...d.keys()].filter((id) => a.has(id) && a.get(id) !== d.get(id)),
    nuevos: [...d.keys()].filter((id) => !a.has(id)),
    quitados: [...a.keys()].filter((id) => !d.has(id)),
  };
  const cabeza = (h: string) => h.slice(0, Math.max(0, inicioDelCuerpo(h)));
  if (cabeza(antes) !== cabeza(despues)) diferencias.estilos = true;
  return diferencias;
}

const NOMBRES: Record<string, string> = {
  encabezado: 'Encabezado',
  cabecera: 'Encabezado',
  menu: 'Menú',
  navegacion: 'Navegación',
  hero: 'Portada',
  portada: 'Portada',
  inicio: 'Inicio',
  nosotros: 'Nosotros',
  servicios: 'Servicios',
  productos: 'Productos',
  galeria: 'Galería',
  testimonios: 'Testimonios',
  precios: 'Precios',
  contacto: 'Contacto',
  formulario: 'Formulario',
  pie: 'Pie de página',
};

// "encabezado" → "Encabezado"; "menu-del-dia" → "Menu del dia".
export function nombreDeBloque(id: string, etiqueta?: string): string {
  if (NOMBRES[id]) return NOMBRES[id];
  if (!id && etiqueta === 'footer') return 'Pie de página';
  const texto = id.replace(/[-_]+/g, ' ').trim();
  return texto ? texto[0].toUpperCase() + texto.slice(1) : 'Bloque';
}
