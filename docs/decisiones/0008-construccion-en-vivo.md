# 0008 · La página se arma en vivo con lo que ya mandó Gemini

- **Estado:** aceptada · **Fecha:** 2026-10-19 · Lado del servidor: [ADR 0001 del backend](../../../backend/docs/decisiones/0001-respuesta-en-stream-con-alternativa.md)

## Contexto
Generar una página tarda de 10 a 60 s. La experiencia pedida es ver la página **armarse por bloques** (encabezado, secciones, pie, en orden) con el progreso visible, y no una barra de carga inventada.

## Decisión
- El backend reenvía el stream de Gemini como NDJSON, y `PaginasService` lo lee con `fetch` y `ReadableStream`.
- `bloquesCompletos()` recorre el HTML a medio llegar y devuelve los bloques `data-vtw` de primer nivel que **ya cerraron**. Usa un escaneo de etiquetas: `DOMParser` cerraría solo lo que está a medias. Salta comentarios y el contenido de `<style>` y `<title>`, y tolera HTML imperfecto.
- Cada vez que cierra un bloque nuevo (no con cada trozo, para que el iframe no parpadee), `documentoParcial()` arma un documento con el `<head>` y esos bloques. El bloque recién llegado entra con una animación breve, salvo con movimiento reducido.
- `ui-construccion` dice qué pasa, qué bloques llegaron (✓ Encabezado…) y cuántos caracteres van. Solo el texto de estado es `role="status"`.
- **Alternativa sin stream.** Si no llega un byte en 12 s, si el stream se corta o si un proxy responde 502, 503 o 504 sin JSON, se repite con `?stream=0`.
  - El progreso dice «sin vista en vivo».
  - Al llegar la página completa, se arma igual **por bloques, en orden**, cada 220 ms.
  - Lo mismo cuando viene de la caché, que lo dice.
- **Al editar,** la página actual se queda a la vista con el progreso encima, y al terminar se resalta lo que cambió (`diffBloques`).

## Consecuencias
- Lo que se ve armarse es lo que la IA ya escribió: si un bloque aparece, ya está en la página.
- Cada bloque nuevo recarga el `srcdoc` (un instante en blanco). Es el costo de no tener scripts dentro del iframe ([ADR 0006](0006-iframe-sin-permisos.md)).
- Con la alternativa, la animación de los bloques ya no es la llegada real sino su presentación en orden, y la interfaz lo dice («sin vista en vivo», «desde la caché»).
