import { TestBed } from '@angular/core/testing';
import { Microfono } from './microfono';

function montar(entradas: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(Microfono);
  for (const [k, v] of Object.entries({ escuchando: false, nivel: 0, ...entradas }))
    fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  const raiz = fixture.nativeElement as HTMLElement;
  return { fixture, raiz, boton: raiz.querySelector<HTMLButtonElement>('button.microfono')! };
}

describe('ui-microfono', () => {
  it('es un botón presionable con nombre accesible que cambia al escuchar', () => {
    const { fixture, boton } = montar();
    expect(boton.getAttribute('aria-pressed')).toBe('false');
    expect(boton.getAttribute('aria-label')).toBe('Dictar una orden');
    fixture.componentRef.setInput('escuchando', true);
    fixture.detectChanges();
    expect(boton.getAttribute('aria-pressed')).toBe('true');
    expect(boton.getAttribute('aria-label')).toBe('Dejar de escuchar');
  });

  it('los anillos siguen el volumen real del micrófono', () => {
    const { fixture, raiz } = montar({ escuchando: true, nivel: 0.5 });
    expect(
      raiz.querySelector<HTMLElement>('.microfono__escena')!.style.getPropertyValue('--nivel'),
    ).toBe('0.5');
    fixture.componentRef.setInput('nivel', 0.9);
    fixture.detectChanges();
    expect(
      raiz.querySelector<HTMLElement>('.microfono__escena')!.style.getPropertyValue('--nivel'),
    ).toBe('0.9');
  });

  it('sin escuchar, el nivel no se muestra', () => {
    const { raiz } = montar({ nivel: 0.8 });
    expect(
      raiz.querySelector<HTMLElement>('.microfono__escena')!.style.getPropertyValue('--nivel'),
    ).toBe('0');
  });

  it('emite pulsar al hacer clic', () => {
    const { fixture, boton } = montar();
    let veces = 0;
    fixture.componentInstance.pulsar.subscribe(() => veces++);
    boton.click();
    expect(veces).toBe(1);
  });

  it('el vúmetro (para movimiento reducido) va en pasos y es decorativo', () => {
    const { raiz } = montar({ escuchando: true, nivel: 0.55 });
    const vumetro = raiz.querySelector('.vumetro')!;
    expect(vumetro.getAttribute('aria-hidden')).toBe('true');
    expect(raiz.querySelectorAll('.vumetro__paso--activo')).toHaveLength(3);
  });
});
