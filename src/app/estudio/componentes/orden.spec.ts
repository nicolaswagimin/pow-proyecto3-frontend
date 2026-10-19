import { TestBed } from '@angular/core/testing';
import { IDIOMAS_VOZ } from '../../voz/voz.service';
import { Orden } from './orden';

function montar(entradas: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(Orden);
  const valores = {
    texto: '',
    confirmado: '',
    interino: '',
    escuchando: false,
    disponible: true,
    idioma: 'es-CO',
    enviando: false,
    ...entradas,
  };
  for (const [k, v] of Object.entries(valores)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return { fixture, raiz: fixture.nativeElement as HTMLElement };
}

describe('ui-orden', () => {
  it('mientras escucha, muestra lo confirmado en tinta y lo interino aparte', () => {
    const { raiz } = montar({
      escuchando: true,
      confirmado: 'una landing para',
      interino: 'una cafetería',
    });
    expect(raiz.querySelector('.en-vivo__confirmado')?.textContent?.trim()).toBe(
      'una landing para',
    );
    expect(raiz.querySelector('.en-vivo__interino')?.textContent?.trim()).toBe('una cafetería');
  });

  it('el campo es editable y tiene etiqueta; Enviar emite el texto', () => {
    const { fixture, raiz } = montar({ texto: 'una cafetería' });
    const campo = raiz.querySelector<HTMLTextAreaElement>('textarea')!;
    expect(raiz.querySelector(`label[for="${campo.id}"]`)?.textContent).toContain('Tu orden');
    campo.value = 'una cafetería en Pasto';
    campo.dispatchEvent(new Event('input'));
    const enviados: string[] = [];
    fixture.componentInstance.enviar.subscribe((t) => enviados.push(t));
    raiz.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    expect(enviados).toEqual(['una cafetería en Pasto']);
  });

  it('Enter envía y Mayús+Enter hace un salto de línea', () => {
    const { fixture, raiz } = montar({ texto: 'hola' });
    const enviados: string[] = [];
    fixture.componentInstance.enviar.subscribe((t) => enviados.push(t));
    const campo = raiz.querySelector('textarea')!;
    campo.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true }));
    expect(enviados).toEqual([]);
    campo.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(enviados).toEqual(['hola']);
  });

  it('sin texto, Enviar está deshabilitado', () => {
    const { raiz } = montar({ texto: '  ' });
    expect(
      raiz.querySelector('ui-button button')?.hasAttribute('disabled') ||
        raiz.querySelector('ui-button button')?.getAttribute('aria-disabled') === 'true',
    ).toBe(true);
  });

  it('sin Web Speech API (Firefox) avisa y el teclado hace lo mismo', () => {
    const { raiz } = montar({ disponible: false });
    expect(raiz.querySelector('.aviso-teclado')?.textContent).toMatch(/no permite dictar/);
    expect(raiz.querySelector('textarea')).not.toBeNull();
    expect(raiz.querySelector('select')).toBeNull();
  });

  it('elige la variante del español con un select con etiqueta', () => {
    const { fixture, raiz } = montar();
    const select = raiz.querySelector('select')!;
    expect(raiz.querySelector(`label[for="${select.id}"]`)?.textContent).toMatch(
      /Variante del español/,
    );
    expect([...select.options].map((o) => o.value)).toEqual(IDIOMAS_VOZ.map((i) => i.codigo));
    expect(select.value).toBe('es-CO');
    const elegidos: string[] = [];
    fixture.componentInstance.cambiarIdioma.subscribe((c) => elegidos.push(c));
    select.value = 'es-MX';
    select.dispatchEvent(new Event('change'));
    expect(elegidos).toEqual(['es-MX']);
  });
});
