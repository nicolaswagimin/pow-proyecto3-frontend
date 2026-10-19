# 0005 · La voz se visualiza con el volumen real del micrófono

- **Estado:** aceptada; actualiza la [0004](0004-movimiento-que-cuenta-la-voz.md) · **Fecha:** 2026-10-19

## Contexto
La [ADR 0004](0004-movimiento-que-cuenta-la-voz.md) prohibió las ondas de audio porque, sin un análisis real del audio, una onda es decoración, y la Web Speech API no entrega el volumen. En el estudio de `/app`, el micrófono es el protagonista: hace falta mostrar que la app está oyendo y cuánto, sobre todo en el primer segundo, antes de que llegue la primera palabra.

## Decisión
- Mientras se dicta, `NivelMicrofono` abre el micrófono con `getUserMedia` y un `AnalyserNode` de **Web Audio** mide el **RMS real** de la señal en cada cuadro (0 a 1).
- Tres anillos alrededor del gran botón crecen y se intensifican con ese nivel. Si no hay sonido, quedan quietos y tenues; sin escuchar, no se ven.
- El micrófono se cierra al terminar de dictar.
- **Con movimiento reducido** los anillos no se muestran, y un vúmetro de cinco pasos indica el nivel sin animación.
- El piloto REC sigue siendo el único color cálido: el botón se vuelve REC mientras escucha.

## Consecuencias
- La regla de la 0004 se mantiene: **lo que se mueve en pantalla es verdad**. Los anillos solo se mueven si el micrófono oye algo, y ahora eso se puede medir.
- El navegador pide el permiso del micrófono una vez para las dos APIs. Si `getUserMedia` falla, se dicta igual, sin visualización, y el mensaje lo da el reconocimiento.
- La visualización es `aria-hidden`: no agrega información para un lector de pantalla, que ya sabe por `aria-pressed` que el micrófono está abierto.
