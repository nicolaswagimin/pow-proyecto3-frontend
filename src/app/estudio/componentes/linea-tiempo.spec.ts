import { TestBed } from '@angular/core/testing';
import { Version } from '../versiones';
import { LineaTiempo } from './linea-tiempo';

const v = (id: number, base: number | null, orden: string): Version => ({
  id,
  base_id: base,
  orden,
  tipo: base === null ? 'crear' : 'editar',
  html: '',
  creado_en: '2026-10-19T15:04:00.000Z',
});

function montar(entradas: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(LineaTiempo);
  const valores = {
    versiones: [v(1, null, 'una cafetería'), v(2, 1, 'título azul'), v(3, 1, 'agrega contacto')],
    actual: 2,
    puedeDeshacer: true,
    puedeRehacer: false,
    ...entradas,
  };
  for (const [k, val] of Object.entries(valores)) fixture.componentRef.setInput(k, val);
  fixture.detectChanges();
  return { fixture, raiz: fixture.nativeElement as HTMLElement };
}

describe('ui-linea-tiempo', () => {
  it('lista cada versión con su número y la orden que la produjo; marca la actual', () => {
    const { raiz } = montar();
    const items = [...raiz.querySelectorAll('.version')];
    expect(items.map((i) => i.querySelector('.version__numero')!.textContent!.trim())).toEqual([
      '1',
      '2',
      '3',
    ]);
    expect(items.map((i) => i.querySelector('.version__orden')!.textContent!.trim())).toEqual([
      '«una cafetería»',
      '«título azul»',
      '«agrega contacto»',
    ]);
    expect(raiz.querySelector('[aria-current="true"] .version__orden')?.textContent).toContain(
      'título azul',
    );
  });

  it('una versión que salió de otra que no es la anterior lo dice', () => {
    const { raiz } = montar();
    expect(raiz.querySelectorAll('.version')[2].textContent).toMatch(/desde la 1/);
  });

  it('volver a una versión, deshacer y rehacer emiten', () => {
    const { fixture, raiz } = montar();
    const eventos: string[] = [];
    fixture.componentInstance.irA.subscribe((id) => eventos.push(`ir ${id}`));
    fixture.componentInstance.deshacer.subscribe(() => eventos.push('deshacer'));
    fixture.componentInstance.rehacer.subscribe(() => eventos.push('rehacer'));
    raiz.querySelectorAll<HTMLButtonElement>('.version button')[2].click();
    raiz.querySelector<HTMLButtonElement>('.deshacer')!.click();
    expect(raiz.querySelector<HTMLButtonElement>('.rehacer')!.disabled).toBe(true);
    expect(eventos).toEqual(['ir 3', 'deshacer']);
  });
});
