import { TestBed } from '@angular/core/testing';
import { Progreso } from '../estudio-estado';
import { Construccion } from './construccion';

function montar(progreso: Partial<Progreso>, orden = '') {
  const fixture = TestBed.createComponent(Construccion);
  fixture.componentRef.setInput('progreso', {
    texto: '',
    bloques: [],
    caracteres: 0,
    sinStream: false,
    desdeCache: false,
    ...progreso,
  });
  fixture.componentRef.setInput('orden', orden);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('ui-construccion', () => {
  it('dice qué pasa, qué bloques llegaron y cuántos caracteres van', () => {
    const raiz = montar(
      {
        texto: 'Armando la página…',
        bloques: [
          { id: 'encabezado', nombre: 'Encabezado' },
          { id: 'menu', nombre: 'Menú' },
        ],
        caracteres: 4321,
      },
      'una cafetería',
    );
    expect(raiz.querySelector('.estado')?.textContent).toContain('Armando la página…');
    expect([...raiz.querySelectorAll('.bloques li')].map((li) => li.textContent!.trim())).toEqual([
      'Encabezado',
      'Menú',
    ]);
    expect(raiz.querySelector('.cifra')?.textContent).toMatch(/4\.?321 caracteres/);
    expect(raiz.querySelector('.orden')?.textContent).toContain('una cafetería');
  });

  it('el estado es una región que se anuncia (aria-live) y los bloques no repiten todo', () => {
    const raiz = montar({ texto: 'Pidiendo la página a la IA…' });
    expect(raiz.querySelector('.estado')?.getAttribute('role')).toBe('status');
  });

  it('avisa cuando se usa la alternativa sin stream o la caché', () => {
    expect(montar({ sinStream: true }).textContent).toMatch(/sin vista en vivo/);
    expect(montar({ desdeCache: true }).textContent).toMatch(/caché/);
  });
});
