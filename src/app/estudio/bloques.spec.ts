import { bloquesCompletos, diffBloques, documentoParcial, nombreDeBloque } from './bloques';

const HEAD =
  '<!DOCTYPE html><html lang="es"><head><title>Café</title><style>h1{color:navy}</style></head><body>';
const ENCABEZADO = '<header data-vtw="encabezado"><h1>Café</h1></header>';
const MENU = '<section data-vtw="menu"><h2>Menú</h2><section><p>anidada</p></section></section>';
const PIE = '<footer data-vtw="pie"><p>Pasto</p></footer>';
const COMPLETO = `${HEAD}${ENCABEZADO}${MENU}${PIE}</body></html>`;

describe('bloquesCompletos', () => {
  it('solo cuenta los bloques que ya cerraron, en orden', () => {
    expect(bloquesCompletos(HEAD).map((b) => b.id)).toEqual([]);
    expect(
      bloquesCompletos(HEAD + ENCABEZADO + '<section data-vtw="menu"><h2>Me').map((b) => b.id),
    ).toEqual(['encabezado']);
    // Una sección anidada que cierra no cierra el bloque de afuera.
    expect(bloquesCompletos(HEAD + ENCABEZADO + MENU.slice(0, -10)).map((b) => b.id)).toEqual([
      'encabezado',
    ]);
    expect(bloquesCompletos(COMPLETO).map((b) => b.id)).toEqual(['encabezado', 'menu', 'pie']);
  });

  it('devuelve el HTML exacto de cada bloque y su etiqueta', () => {
    expect(bloquesCompletos(COMPLETO)[1]).toEqual({ id: 'menu', etiqueta: 'section', html: MENU });
  });

  it('no confunde un data-vtw dentro del CSS con un bloque', () => {
    const conCss = HEAD.replace('h1{color:navy}', '[data-vtw="menu"]{padding:1rem}') + ENCABEZADO;
    expect(bloquesCompletos(conCss).map((b) => b.id)).toEqual(['encabezado']);
  });
});

describe('documentoParcial', () => {
  it('arma un documento con el <head> y los bloques que ya llegaron', () => {
    const doc = documentoParcial(HEAD + ENCABEZADO + '<section data-vtw="menu"><h2>Me')!;
    expect(doc).toContain('<style>h1{color:navy}</style>');
    expect(doc).toContain(ENCABEZADO);
    expect(doc).not.toContain('<h2>Me');
    expect(doc.trim().endsWith('</html>')).toBe(true);
  });

  it('sin <head> completo todavía, devuelve null', () => {
    expect(documentoParcial('<!DOCTYPE html><html><head><style>h1{')).toBeNull();
  });
});

describe('diffBloques', () => {
  it('dice qué bloques cambiaron, cuáles son nuevos y cuáles se quitaron', () => {
    const despues = `${HEAD}${ENCABEZADO.replace('Café', 'Café Real')}${MENU}<section data-vtw="contacto"></section></body></html>`;
    expect(diffBloques(COMPLETO, despues)).toEqual({
      cambiados: ['encabezado'],
      nuevos: ['contacto'],
      quitados: ['pie'],
    });
  });

  it('un cambio solo de estilos generales no marca bloques, pero se informa', () => {
    const despues = COMPLETO.replace('h1{color:navy}', 'h1{color:blue}');
    expect(diffBloques(COMPLETO, despues)).toEqual({
      cambiados: [],
      nuevos: [],
      quitados: [],
      estilos: true,
    });
  });
});

describe('nombreDeBloque', () => {
  it('nombra los bloques en palabras', () => {
    expect(nombreDeBloque('encabezado', 'header')).toBe('Encabezado');
    expect(nombreDeBloque('pie', 'footer')).toBe('Pie de página');
    expect(nombreDeBloque('menu-del-dia', 'section')).toBe('Menu del dia');
  });
});
