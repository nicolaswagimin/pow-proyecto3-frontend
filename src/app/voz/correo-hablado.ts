// Convierte un correo dictado en uno escrito: "Ana arroba correo punto com" → "ana@correo.com".
// Chrome a veces ya entrega "@" y "."; las dos formas se aceptan.
const REEMPLAZOS: [RegExp, string][] = [
  [/\s*\barroba\b\s*/gi, '@'],
  [/\s*\bgui[oó]n bajo\b\s*/gi, '_'],
  [/\s*\bbarra baja\b\s*/gi, '_'],
  [/\s*\bgui[oó]n\b\s*/gi, '-'],
  [/\s*\bpunto\b\s*/gi, '.'],
];

export function correoHablado(texto: string): string {
  let correo = texto.trim().toLowerCase();
  for (const [patron, signo] of REEMPLAZOS) correo = correo.replace(patron, signo);
  return correo.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '').replace(/\.$/, '');
}
