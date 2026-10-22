import { CSP_VISTA, documentoVistaPrevia, htmlParaDescargar, sanear } from './sanear';

const pagina = (cuerpo: string, head = '') =>
  `<!DOCTYPE html><html lang="es"><head><title>x</title>${head}<style>h1{color:navy}</style></head><body>${cuerpo}</body></html>`;

const parsear = (html: string) => new DOMParser().parseFromString(html, 'text/html');

describe('sanear', () => {
  const peligrosos: [string, string][] = [
    ['script', '<script>alert(1)</script><p>hola</p>'],
    ['script SVG', '<svg><script>alert(1)</script></svg>'],
    ['onerror', '<img src="https://x.test/a.png" onerror="alert(1)">'],
    ['onclick en mayúsculas', '<button ONCLICK="alert(1)">x</button>'],
    ['javascript: en href', '<a href="javascript:alert(1)">x</a>'],
    ['javascript: con espacios y tabulador', '<a href=" \tjava\nscript:alert(1)">x</a>'],
    ['iframe', '<iframe src="https://malo.test"></iframe>'],
    ['srcdoc', '<iframe srcdoc="<script>alert(1)</script>"></iframe>'],
    ['object y embed', '<object data="x.swf"></object><embed src="x.swf">'],
    ['formaction', '<form><button formaction="javascript:alert(1)">x</button></form>'],
    [
      'mXSS con noscript y comentario',
      '<noscript><p title="</noscript><img src=x onerror=alert(1)>"></p></noscript>',
    ],
    ['mXSS con math y style', '<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>'],
  ];
  for (const [nombre, cuerpo] of peligrosos) {
    it(`quita lo peligroso: ${nombre}`, () => {
      const doc = parsear(sanear(pagina(cuerpo)));
      expect(doc.querySelector('script, iframe, object, embed, noscript')).toBeNull();
      const atributos = [...doc.querySelectorAll('*')].flatMap((el) => [...el.attributes]);
      expect(
        atributos.filter(
          (a) => a.name.startsWith('on') || a.name === 'srcdoc' || a.name === 'formaction',
        ),
      ).toEqual([]);
      expect(atributos.filter((a) => /javascript:/i.test(a.value.replace(/\s/g, '')))).toEqual([]);
    });
  }

  it('quita <template>: querySelectorAll no entra en su contenido (shadow DOM declarativo)', () => {
    const limpio = sanear(
      pagina(
        '<div><template shadowrootmode="open"><img src=x onerror="alert(1)"><script>alert(2)</script></template></div><p>hola</p>',
      ),
    );
    expect(limpio).not.toMatch(/<template|onerror|<script/i);
    expect(limpio).toContain('<p>hola</p>');
  });

  it('quita meta refresh y base (podrían navegar o cambiar las rutas)', () => {
    const doc = parsear(
      sanear(
        pagina(
          '<p>x</p>',
          '<meta http-equiv="refresh" content="0;url=https://malo.test"><base href="https://malo.test/">',
        ),
      ),
    );
    expect(doc.querySelector('meta[http-equiv], base')).toBeNull();
  });

  it('neutraliza CSS que ejecuta o carga código (expression, javascript:, -moz-binding)', () => {
    const html = sanear(
      pagina(
        '<p style="width:expression(alert(1))">x</p>',
        '<style>body{background:url(javascript:alert(1))}div{-moz-binding:url(x.xml)}</style>',
      ),
    );
    expect(html).not.toMatch(/expression\(|javascript:|-moz-binding/i);
  });

  it('solo deja hojas de estilo de Google Fonts', () => {
    const doc = parsear(
      sanear(
        pagina(
          '<p>x</p>',
          '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter"><link rel="stylesheet" href="https://malo.test/x.css"><link rel="prefetch" href="https://malo.test">',
        ),
      ),
    );
    expect([...doc.querySelectorAll('link')].map((l) => l.getAttribute('href'))).toEqual([
      'https://fonts.googleapis.com/css2?family=Inter',
    ]);
  });

  it('conserva el contenido, los estilos y los data-vtw', () => {
    const doc = parsear(sanear(pagina('<header data-vtw="encabezado"><h1>Café</h1></header>')));
    expect(doc.querySelector('[data-vtw="encabezado"] h1')?.textContent).toBe('Café');
    expect(doc.querySelector('style')?.textContent).toBe('h1{color:navy}');
  });

  it('llega a un punto fijo: sanear dos veces da lo mismo', () => {
    const una = sanear(
      pagina(
        '<noscript><p title="</noscript><img src=x onerror=alert(1)>"></p></noscript><p>x</p>',
      ),
    );
    expect(sanear(una)).toBe(una);
  });
});

describe('documentoVistaPrevia', () => {
  it('agrega la CSP más estricta y neutraliza los enlaces (la vista previa no navega)', () => {
    const doc = parsear(
      documentoVistaPrevia(pagina('<a href="https://otra.test">x</a><a href="#menu">y</a>')),
    );
    const csp = doc.querySelector('meta[http-equiv="Content-Security-Policy"]')!;
    expect(csp.getAttribute('content')).toBe(CSP_VISTA);
    expect(CSP_VISTA).toContain("default-src 'none'");
    expect(CSP_VISTA).not.toMatch(/script-src/);
    const enlaces = [...doc.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(enlaces).toEqual(['#', '#menu']);
  });

  it('las hojas de Google Fonts conservan su href (solo se neutralizan los enlaces que navegan)', () => {
    const doc = parsear(
      documentoVistaPrevia(pagina('<a href="/otra">x</a>', '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter">')),
    );
    expect(doc.querySelector('link')?.getAttribute('href')).toBe('https://fonts.googleapis.com/css2?family=Inter');
    expect(doc.querySelector('a')?.getAttribute('href')).toBe('#');
  });

  it('marca los bloques que cambiaron y los que acaban de llegar', () => {
    const doc = parsear(
      documentoVistaPrevia(
        pagina('<header data-vtw="encabezado"></header><section data-vtw="menu"></section>'),
        {
          resaltar: ['menu'],
          entrando: ['encabezado'],
        },
      ),
    );
    expect(doc.querySelector('[data-vtw="menu"]')?.hasAttribute('data-vtw-cambio')).toBe(true);
    expect(doc.querySelector('[data-vtw="encabezado"]')?.hasAttribute('data-vtw-entrando')).toBe(
      true,
    );
    const estilos = doc.querySelector('style[data-vtw-vista]')!.textContent!;
    expect(estilos).toContain('prefers-reduced-motion');
  });
});

describe('htmlParaDescargar', () => {
  it('es la página saneada, sin las marcas de la vista previa y con sus enlaces', () => {
    const html = htmlParaDescargar(pagina('<a href="https://otra.test">x</a><script>x</script>'));
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('href="https://otra.test"');
    expect(html).not.toMatch(/<script|Content-Security-Policy|data-vtw-vista/);
  });
});
