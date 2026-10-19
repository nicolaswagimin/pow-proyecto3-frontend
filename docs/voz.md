# Voz · VoiceToWeb

La voz es la forma principal de usar VoiceToWeb, pero nunca la única: el teclado hace lo mismo.

## Reconocimiento: Web Speech API (`voz/voz.service.ts`)

`VozService.escucharOrden()` usa `SpeechRecognition` (o `webkitSpeechRecognition`):

- `lang`: la variante elegida, **`es-CO` por defecto**. También están `es-MX`, `es-ES`, `es-AR`, `es-CL`, `es-PE` y `es-US`, que se eligen en el selector «Variante del español» y se recuerdan en `localStorage` (`vtw.idioma-voz`).
- `continuous: true`, `interimResults: true`. En cada resultado se recalcula lo **confirmado** (los resultados finales) y lo **interino** (lo que el reconocedor todavía puede corregir), así el texto aparece **palabra por palabra**.
- **Cuándo termina:** tras 2.5 s sin resultados nuevos, al pulsar otra vez el micrófono, o a los 7 s si no se dijo nada todavía.
- **Lo dictado no se envía solo.** Queda en el campo «Tu orden» para revisarlo y editarlo. La excepción son los comandos.

`dictar()`, la versión de una sola frase, la sigue usando el acceso (dictar el correo) sin cambios.

### Comandos (`voz/comandos.ts`)

`interpretarComando(texto)` normaliza el texto (sin mayúsculas, tildes, puntuación ni cortesías como «por favor») y lo compara con frases completas: deshacer, rehacer, nueva página y descargar, con sus variantes (ver [funcionalidades.md](funcionalidades.md#6-comandos-de-control-por-voz)). Solo cuenta la frase entera, así que una orden de edición que menciona «deshacer» o «descargar» sigue siendo una orden.

Un comando dictado se ejecuta enseguida. Escrito y enviado, también.

## Visualización: Web Audio (`voz/nivel-microfono.ts`)

`NivelMicrofono` abre el micrófono con `getUserMedia({ audio: { echoCancellation, noiseSuppression } })`, lo conecta a un `AnalyserNode` (`fftSize` 1024) y en cada `requestAnimationFrame` calcula el **RMS** de la señal, escalado de 0 a 1. Sube rápido y baja despacio, como un vúmetro. El valor es una signal que mueve los anillos del micrófono.

- Se abre al empezar a dictar y **se cierra al terminar**: detiene las pistas y cierra el `AudioContext`.
- **Los anillos solo se mueven si el micrófono oye algo.** Es la actualización de la [ADR 0004](decisiones/0004-movimiento-que-cuenta-la-voz.md) en la [0005](decisiones/0005-visualizacion-del-volumen-real.md).
- **Con movimiento reducido** los anillos no se muestran, y un vúmetro de cinco pasos indica el nivel sin animar.
- Si Web Audio no está, se dicta igual, sin visualización.

## Compatibilidad

| Navegador | Dictado | Visualización |
|---|---|---|
| Chrome, Edge (escritorio y Android) | Sí (necesita conexión: el reconocimiento es en línea) | Sí |
| Safari (macOS, iOS) | Sí (`webkitSpeechRecognition`) | Sí |
| Firefox | **No**: no trae la Web Speech API | — |

En Firefox no aparece el micrófono, y un aviso dice: «Este navegador no permite dictar (por ejemplo, Firefox). Escribe la orden: todo funciona igual.»

## Errores

| Origen | Error | Mensaje |
|---|---|---|
| Reconocimiento | `not-allowed`, `service-not-allowed` | Sin permiso para el micrófono, o el navegador no permite dictar aquí |
| Reconocimiento | `audio-capture` | No encuentro un micrófono |
| Reconocimiento | `network` | El dictado necesita conexión a internet |
| Reconocimiento | `no-speech`, o nada dicho | No te escuché |
| Reconocimiento | `language-not-supported` | Esa variante no está disponible: prueba con otra |
| `getUserMedia` | `NotAllowedError`, `NotFoundError`, `NotReadableError` | Permiso, sin micrófono, micrófono ocupado. La visualización falla en silencio; el mensaje lo da el reconocimiento |

Todos terminan en «…o escribe la orden».

## Pruebas

- `voz.service.spec.ts`: un reconocedor simulado con interinos, silencio, `detener()`, errores, variantes y Firefox.
- `nivel-microfono.spec.ts`: `getUserMedia` y `AudioContext` simulados, RMS, cierre y errores.
- `comandos.spec.ts`.

La verificación en Chrome usa un reconocedor falso que «oye» frases palabra por palabra y el micrófono falso de Chrome (`--use-fake-device-for-media-stream`): los anillos siguen el pitido de prueba.
