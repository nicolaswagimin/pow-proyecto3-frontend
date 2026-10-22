// Las versiones de un proyecto forman un árbol: cada una guarda la versión de la que salió
// (base_id). Deshacer y rehacer navegan por ese árbol y nunca se borra ninguna versión
// (docs/versiones.md, docs/decisiones/0007).

export interface Version {
  id: number;
  base_id: number | null;
  orden: string;
  tipo: 'crear' | 'editar';
  html: string;
  creado_en: string;
}

// Deshacer: la versión de la que salió la actual (null si es la primera).
export function deshacer(versiones: Version[], actual: number): number | null {
  return versiones.find((v) => v.id === actual)?.base_id ?? null;
}

// Rehacer: la versión más reciente que salió de la actual (la última rama que se siguió). La lista
// está en orden de creación; los ids no sirven para eso porque los no guardados son negativos.
export function rehacer(versiones: Version[], actual: number): number | null {
  const hijas = versiones.filter((v) => v.base_id === actual);
  return hijas.at(-1)?.id ?? null;
}

export const puedeDeshacer = (versiones: Version[], actual: number) =>
  deshacer(versiones, actual) !== null;
export const puedeRehacer = (versiones: Version[], actual: number) =>
  rehacer(versiones, actual) !== null;

// Una versión nueva se agrega al final; las anteriores quedan intactas.
export function agregar(versiones: Version[], nueva: Version): Version[] {
  return [...versiones, nueva];
}
