import { TestBed } from '@angular/core/testing';
import { Ventana } from './ventana';

function montar(entradas: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(Ventana);
  const valores = {
    documento: '<!DOCTYPE html><html><body><p>hola</p></body></html>',
    nombre: 'Café Pasto',
    ...entradas,
  };
  for (const [k, v] of Object.entries(valores)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return { fixture, raiz: fixture.nativeElement as HTMLElement };
}

describe('ui-ventana', () => {
  it('muestra la página en un iframe sin ningún permiso (sandbox vacío) y con título', () => {
    const { raiz } = montar();
    const iframe = raiz.querySelector('iframe')!;
    expect(iframe.getAttribute('sandbox')).toBe('');
    expect(iframe.getAttribute('srcdoc')).toContain('<p>hola</p>');
    expect(iframe.title).toBe('Vista previa de Café Pasto');
  });

  it('el documento llega entero al iframe: head, estilos, CSP y data-vtw (Angular no lo re-sanea)', () => {
    const documento =
      '<!DOCTYPE html><html><head><meta http-equiv="Content-Security-Policy" content="default-src \'none\'"><style>h1{color:navy}</style></head><body><header data-vtw="encabezado"><h1>x</h1></header></body></html>';
    const srcdoc = montar({ documento }).raiz.querySelector('iframe')!.getAttribute('srcdoc')!;
    expect(srcdoc).toContain('<style>h1{color:navy}</style>');
    expect(srcdoc).toContain('data-vtw="encabezado"');
    expect(srcdoc).toContain('Content-Security-Policy');
  });

  it('la barra lleva el nombre del proyecto', () => {
    expect(montar().raiz.querySelector('.ventana__nombre')?.textContent?.trim()).toBe('Café Pasto');
  });

  it('cambia entre móvil, tablet y escritorio con botones presionables', () => {
    const { fixture, raiz } = montar();
    const botones = [...raiz.querySelectorAll<HTMLButtonElement>('.anchos button')];
    expect(botones.map((b) => b.textContent!.trim())).toEqual(['Móvil', 'Tablet', 'Escritorio']);
    expect(botones.map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'true']);
    botones[0].click();
    fixture.detectChanges();
    expect(botones[0].getAttribute('aria-pressed')).toBe('true');
    expect(raiz.querySelector<HTMLElement>('.ventana__marco')!.style.width).toBe('375px');
    botones[1].click();
    fixture.detectChanges();
    expect(raiz.querySelector<HTMLElement>('.ventana__marco')!.style.width).toBe('768px');
  });

  it('sin documento muestra el lienzo vacío con el texto que le pasan', () => {
    const { raiz } = montar({ documento: null, vacio: 'Aquí aparecerá tu página.' });
    expect(raiz.querySelector('iframe')).toBeNull();
    expect(raiz.querySelector('.ventana__vacio')?.textContent?.trim()).toBe(
      'Aquí aparecerá tu página.',
    );
  });
});
