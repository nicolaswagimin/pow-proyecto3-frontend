// La página que genera Gemini es dato no confiable. Antes de mostrarla pasa por dos defensas
// independientes (docs/vista-previa.md):
// 1. sanear(): quita todo lo que podría ejecutar código, navegar o cargar recursos ajenos.
// 2. Un iframe con sandbox="" (sin ningún permiso) y una CSP sin script-src: aunque algo se
//    escapara del saneado, no se ejecuta.

export const CSP_VISTA = [
  "default-src 'none'",
  "style-src 'unsafe-inline' https://fonts.googleapis.com",
  'font-src https://fonts.gstatic.com data:',
  'img-src https: data:',
].join('; ');

const ELEMENTOS_PELIGROSOS =
  'script, noscript, iframe, frame, frameset, object, embed, applet, base, meta[http-equiv], portal';
const ATRIBUTOS_URL = [
  'href',
  'src',
  'action',
  'formaction',
  'xlink:href',
  'data',
  'poster',
  'srcset',
];
const FUENTES = /^https:\/\/fonts\.googleapis\.com\//;
// CSS que ejecuta o carga código en navegadores viejos: se neutraliza.
const CSS_PELIGROSO = /expression\s*\(|javascript\s*:|-moz-binding|behavior\s*:/gi;

function esJavascript(valor: string): boolean {
  // Los navegadores ignoran espacios y caracteres de control dentro y antes del esquema.
  return /^javascript:/i.test(valor.replace(/[\u0000- ]/g, ''));
}

function atributoPeligroso(atributo: Attr): boolean {
  const nombre = atributo.name.toLowerCase();
  return (
    nombre.startsWith('on') ||
    nombre === 'srcdoc' ||
    nombre === 'formaction' ||
    (ATRIBUTOS_URL.includes(nombre) && esJavascript(atributo.value))
  );
}

function sanearUnaVez(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll(ELEMENTOS_PELIGROSOS).forEach((el) => el.remove());
  doc.querySelectorAll('link').forEach((link) => {
    const esFuente =
      link.getAttribute('rel')?.toLowerCase() === 'stylesheet' &&
      FUENTES.test(link.getAttribute('href') ?? '');
    if (!esFuente) link.remove();
  });
  for (const el of doc.querySelectorAll('*')) {
    for (const atributo of [...el.attributes]) {
      if (atributoPeligroso(atributo)) el.removeAttribute(atributo.name);
    }
    const estilo = el.getAttribute('style');
    if (estilo && CSS_PELIGROSO.test(estilo))
      el.setAttribute('style', estilo.replace(CSS_PELIGROSO, ''));
    CSS_PELIGROSO.lastIndex = 0;
  }
  doc.querySelectorAll('style').forEach((s) => {
    s.textContent = (s.textContent ?? '').replace(CSS_PELIGROSO, '');
  });
  return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
}

const MAX_PASADAS = 5;

// Mutation XSS: serializar y volver a parsear puede convertir texto en elementos. Se sanea hasta
// que el resultado deja de cambiar, así lo que muestra el iframe es exactamente lo que se revisó.
export function sanear(html: string): string {
  let actual = html;
  for (let i = 0; i < MAX_PASADAS; i++) {
    const siguiente = sanearUnaVez(actual);
    if (siguiente === actual) return actual;
    actual = siguiente;
  }
  throw new Error('La página no se pudo mostrar de forma segura.');
}

export interface OpcionesVista {
  resaltar?: string[]; // data-vtw de los bloques que cambiaron con la última orden
  entrando?: string[]; // data-vtw de los bloques que acaban de llegar de Gemini
}

// Los estilos propios de la vista previa: el contorno de lo que cambió y la entrada de un bloque.
// Comunican algo verdadero (un cambio aplicado, un bloque recibido) y respetan el movimiento reducido.
const ESTILOS_VISTA = `
[data-vtw-cambio] { outline: 3px solid #2f3fd0; outline-offset: 3px; animation: vtw-cambio 1.6s ease-out forwards; }
@keyframes vtw-cambio { 0%, 60% { outline-color: #2f3fd0; } 100% { outline-color: transparent; } }
[data-vtw-entrando] { animation: vtw-entra 420ms cubic-bezier(0.16, 1, 0.3, 1) both; }
@keyframes vtw-entra { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) {
  [data-vtw-entrando] { animation: none; }
  [data-vtw-cambio] { animation: none; outline-color: #2f3fd0; }
}`;

// El documento que se carga en el iframe (srcdoc): saneado, con la CSP, sin navegación y con las
// marcas de cambio y de entrada.
export function documentoVistaPrevia(html: string, opciones: OpcionesVista = {}): string {
  const doc = new DOMParser().parseFromString(sanear(html), 'text/html');
  const csp = doc.createElement('meta');
  csp.setAttribute('http-equiv', 'Content-Security-Policy');
  csp.setAttribute('content', CSP_VISTA);
  doc.head.prepend(csp);
  // La vista previa no navega: sin allow-top-navigation no saldría de la pestaña, pero un enlace
  // cargaría otra página dentro del marco. Solo quedan las anclas internas.
  doc.querySelectorAll('a[href], area[href]').forEach((el) => {
    const href = el.getAttribute('href') ?? '';
    if (!href.startsWith('#')) el.setAttribute('href', '#');
  });
  const marcar = (ids: string[] | undefined, atributo: string) => {
    for (const id of ids ?? []) {
      doc
        .querySelectorAll(`[data-vtw="${CSS.escape(id)}"]`)
        .forEach((el) => el.setAttribute(atributo, ''));
    }
  };
  marcar(opciones.resaltar, 'data-vtw-cambio');
  marcar(opciones.entrando, 'data-vtw-entrando');
  const estilos = doc.createElement('style');
  estilos.setAttribute('data-vtw-vista', '');
  estilos.textContent = ESTILOS_VISTA;
  doc.head.append(estilos);
  return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
}

// Lo que se descarga o copia: la página saneada, con sus enlaces y sin nada de la vista previa.
export function htmlParaDescargar(html: string): string {
  return sanear(html);
}
