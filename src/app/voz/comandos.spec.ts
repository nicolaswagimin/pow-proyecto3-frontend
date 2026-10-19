import { interpretarComando } from './comandos';

describe('interpretarComando', () => {
  it('reconoce los cuatro comandos y sus variantes habladas', () => {
    const casos: [string, string][] = [
      ['deshacer', 'deshacer'],
      ['Deshaz eso.', 'deshacer'],
      ['vuelve atrás', 'deshacer'],
      ['rehacer', 'rehacer'],
      ['Rehaz', 'rehacer'],
      ['nueva página', 'nueva'],
      ['Empezar de nuevo', 'nueva'],
      ['página nueva por favor', 'nueva'],
      ['descargar', 'descargar'],
      ['Descarga la página', 'descargar'],
      ['bájala', 'descargar'],
    ];
    for (const [frase, comando] of casos) expect(interpretarComando(frase), frase).toBe(comando);
  });

  it('una orden de edición que menciona un comando no es un comando', () => {
    for (const frase of [
      'deshacer el cambio del título y ponerlo verde',
      'agrega un botón para descargar el menú',
      'crea una nueva página de contacto con un formulario',
      'cambia el título a azul',
      '',
    ]) {
      expect(interpretarComando(frase), frase).toBeNull();
    }
  });
});
