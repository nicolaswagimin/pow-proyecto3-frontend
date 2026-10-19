import { TestBed } from '@angular/core/testing';
import { Ejemplos } from './ejemplos';

describe('ui-ejemplos', () => {
  it('cada ejemplo es un botón que emite su frase', () => {
    const fixture = TestBed.createComponent(Ejemplos);
    fixture.componentRef.setInput('frases', ['Una cafetería en Pasto', 'Una barbería']);
    fixture.detectChanges();
    const raiz = fixture.nativeElement as HTMLElement;
    const elegidas: string[] = [];
    fixture.componentInstance.elegir.subscribe((f) => elegidas.push(f));
    const botones = raiz.querySelectorAll<HTMLButtonElement>('button');
    expect([...botones].map((b) => b.textContent!.trim())).toEqual([
      '«Una cafetería en Pasto»',
      '«Una barbería»',
    ]);
    botones[1].click();
    expect(elegidas).toEqual(['Una barbería']);
    expect(raiz.querySelector('h2')?.textContent).toMatch(/Prueba/);
  });
});
