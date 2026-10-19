import { calcularFuerza, pistaFuerza } from './fuerza';

describe('calcularFuerza', () => {
  it('va de vacía a muy fuerte', () => {
    expect(calcularFuerza('')).toBe(0);
    expect(calcularFuerza('abc')).toBe(1);
    expect(calcularFuerza('abcdefgh1')).toBe(2);
    expect(calcularFuerza('Abcdefg1')).toBe(3);
    expect(calcularFuerza('Abcdefgh1234!')).toBe(4);
  });

  it('la pista pide 8 caracteres si faltan', () => {
    expect(pistaFuerza('abc', 1)).toBe('Usa al menos 8 caracteres.');
  });
});
