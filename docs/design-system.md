# Design system · Toma de dictado

Todos los valores viven en `src/styles/tokens.css`. Ningún componente usa un color, tamaño o duración fuera de estos tokens.

El modo oscuro se aplica siguiendo al sistema (`prefers-color-scheme: dark`) y por elección manual (`[data-theme='dark']`, que guarda el fader). Por eso los valores oscuros aparecen dos veces.

## Color

| Token | Uso | Claro | Oscuro |
|---|---|---|---|
| `--color-fondo` | Alrededor de la hoja | `#EFF1F5` | `#121418` |
| `--color-superficie` | La hoja: guion, formulario, contenido | `#FFFFFF` | `#1B1E24` |
| `--color-texto` | Texto principal y lo dicho ya confirmado | `#16181D` | `#ECEEF2` |
| `--color-texto-suave` | Texto secundario, quién habla | `#4B5263` | `#A3A9B8` |
| `--color-interino` | Texto que el reconocedor todavía puede cambiar | `#6B7280` | `#8B92A3` |
| `--color-borde` | Borde de campos y controles | `#6E7484` | `#7A8191` |
| `--color-maqueta` | Bloques sin ensamblar y separadores (decorativo) | `#D5D9E0` | `#2A2E37` |
| `--color-primario` | Ultramar: botón principal, foco | `#2F3FD0` | `#8C98FF` |
| `--color-primario-contraste` | Texto sobre el primario | `#FFFFFF` | `#121418` |
| `--color-enlace` | Enlaces | `#2F3FD0` | `#8C98FF` |
| `--color-rec` | Piloto REC y micrófono abierto | `#C8261B` | `#FF6B5E` |
| `--color-rec-contraste` | Texto e ícono sobre REC | `#FFFFFF` | `#121418` |
| `--color-error` | Errores | `#B42318` | `#FF8A80` |
| `--color-exito` | Estado que responde | `#17703F` | `#6FD99A` |
| `--color-aviso` | Avisos | `#8A5A00` | `#FFC97A` |
| `--color-foco` | Anillo de foco | `#2F3FD0` | `#8C98FF` |

### Contraste verificado (WCAG 2.2)

Medido sobre la superficie, donde vive todo el texto.

| Par | Claro | Oscuro | Mínimo |
|---|---|---|---|
| texto / superficie | 17.8:1 | 14.4:1 | 4.5:1 |
| texto / fondo | 15.7:1 | 15.9:1 | 4.5:1 |
| texto suave / superficie | 7.8:1 | 7.1:1 | 4.5:1 |
| interino / superficie | 4.8:1 | 5.4:1 | 4.5:1 |
| primario / superficie | 7.7:1 | 6.4:1 | 4.5:1 |
| texto del botón / primario | 7.7:1 | 7.1:1 | 4.5:1 |
| REC / superficie | 5.6:1 | 6.0:1 | 3:1 (indicador) |
| texto sobre REC | 5.6:1 | 6.6:1 | 4.5:1 |
| error / superficie | 6.6:1 | 7.3:1 | 4.5:1 |
| éxito / superficie | 6.1:1 | 9.6:1 | 4.5:1 |
| aviso / superficie | 5.9:1 | 11.0:1 | 4.5:1 |
| borde de control / superficie | 4.7:1 | 4.3:1 | 3:1 |

El texto interino es el más claro de la paleta y aun así pasa AA: es texto que la persona tiene que poder leer. El gris de maqueta no lleva texto encima.

## Tipografía

| Token | Valor | Rol |
|---|---|---|
| `--font-display`, `--font-texto` | Schibsted Grotesk, respaldo `system-ui` | La interfaz que se construye |
| `--font-voz` | Newsreader, respaldo Georgia | Lo que alguien dijo (la transcripción) |
| Pesos | `--peso-normal` 400, `--peso-fuerte` 700, `--peso-display` 700 | |
| Interlineado | `--leading-ajustado` 1.1, `--leading-normal` 1.55 | |

Escala: `--text-xs` 0.75rem, `--text-sm` 0.875rem, `--text-base` 1rem, `--text-lg` 1.125rem, `--text-xl` 1.375rem (las frases del guion), `--text-2xl` clamp(1.75rem → 2.4rem), `--text-3xl` clamp(2.2rem → 3.4rem).

Newsreader se carga en 400 normal e itálica: la itálica marca el texto interino.

## Espaciado

Escala de 4 px: `--space-1` (4 px), `-2` (8), `-3` (12), `-4` (16), `-5` (20), `-6` (24), `-8` (32), `-10` (40), `-12` (48), `-16` (64).

## Radios

| Token | Valor | Dónde |
|---|---|---|
| `--radius-control` | 8 px | Botones, campos, bloques de maqueta |
| `--radius-panel` | 14 px | La hoja |
| `--radius-pill` | 999 px | El piloto REC |

## Sombras

Un solo nivel, `--shadow-elevacion-2`: una sombra corta y neutra que separa la hoja del fondo en escritorio.

## Movimiento

| Token | Valor | Uso |
|---|---|---|
| `--duracion-rapida` | 120 ms | Opacidad del ojo de la contraseña |
| `--duracion-media` | 220 ms | Hover, fundido de tema, registro que sale |
| `--duracion-lenta` | 420 ms | Un bloque que se ensambla, la perilla del fader |
| `--easing-salida` | `cubic-bezier(0.16, 1, 0.3, 1)` | Casi todo |
| `--easing-entrada` | `cubic-bezier(0.7, 0, 0.84, 0)` | Un registro que sale |
| `--easing-resorte` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Ojo de la contraseña |
| `--easing-suave` | `cubic-bezier(0.45, 0, 0.55, 1)` | Puntos de carga, piloto REC |

El ritmo del dictado no es un token: vive en `voz/dictado.ts` (110 ms por palabra y 280 ms entre frases).

Detalle en [animaciones.md](animaciones.md).
