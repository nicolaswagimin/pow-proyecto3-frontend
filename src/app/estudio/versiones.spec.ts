import { Version, agregar, deshacer, puedeDeshacer, puedeRehacer, rehacer } from './versiones';

const v = (id: number, base: number | null, orden = `orden ${id}`): Version => ({
  id,
  base_id: base,
  orden,
  tipo: base === null ? 'crear' : 'editar',
  html: `<p>${id}</p>`,
  creado_en: '',
});

describe('versiones en árbol', () => {
  // 1 → 2 → 3 ; desde 2 se editó otra vez → 4
  const lista = [v(1, null), v(2, 1), v(3, 2), v(4, 2)];

  it('deshacer va a la versión de la que salió la actual', () => {
    expect(deshacer(lista, 3)).toBe(2);
    expect(deshacer(lista, 4)).toBe(2);
    expect(deshacer(lista, 2)).toBe(1);
    expect(deshacer(lista, 1)).toBeNull();
  });

  it('rehacer va a la versión más reciente que salió de la actual', () => {
    expect(rehacer(lista, 2)).toBe(4);
    expect(rehacer(lista, 1)).toBe(2);
    expect(rehacer(lista, 4)).toBeNull();
    // Sin guardar, los ids son negativos y cada vez menores: cuenta el orden de la lista.
    expect(rehacer([v(1, null), v(-1, 1), v(-2, 1)], 1)).toBe(-2);
  });

  it('puedeDeshacer y puedeRehacer', () => {
    expect(puedeDeshacer(lista, 1)).toBe(false);
    expect(puedeDeshacer(lista, 3)).toBe(true);
    expect(puedeRehacer(lista, 3)).toBe(false);
    expect(puedeRehacer(lista, 2)).toBe(true);
  });

  it('agregar desde una versión vieja no borra nada: la nueva sale de la que se estaba viendo', () => {
    const despues = agregar(lista, { ...v(5, 3), id: 5 });
    expect(despues.map((x) => x.id)).toEqual([1, 2, 3, 4, 5]);
    expect(despues).not.toBe(lista);
    expect(lista).toHaveLength(4);
    // Deshacer desde la 5 vuelve a la 3; rehacer desde la 3 va a la 5.
    expect(deshacer(despues, 5)).toBe(3);
    expect(rehacer(despues, 3)).toBe(5);
  });

  it('deshacer y rehacer de ida y vuelta llegan a la misma versión', () => {
    expect(rehacer(lista, deshacer(lista, 4)!)).toBe(4);
  });
});
