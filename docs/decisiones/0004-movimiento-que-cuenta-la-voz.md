# 0004 · Movimiento que cuenta la voz, sin ondas decorativas

- **Estado:** aceptada; el punto 1 se actualizó en la [0005](0005-visualizacion-del-volumen-real.md)
- **Fecha:** 2026-10-12

## Contexto
El recurso obvio para una app de voz es una onda de audio o un ecualizador animado. Sin un análisis real del audio, esa onda es decoración. Además, la Web Speech API no entrega el volumen.

## Decisión
1. El único indicador de audio es el piloto REC: se enciende con el micrófono abierto y late solo entre `speechstart` y `speechend`, que son eventos reales.
2. Las animaciones del producto son el texto interino que se confirma y los bloques que se ensamblan.
3. Nada depende del cursor y nada se anima en bucle salvo un proceso en curso.
4. Con movimiento reducido, todo aparece listo.

## Consecuencias
- Se eliminaron `fx/cielo`, `fx/estallido`, el sol del avatar, el magnetismo y el amanecer entre pantallas.
- Lo que se mueve en pantalla siempre es verdad: si REC late, el navegador está detectando voz.

## Actualización (0005)
En el estudio de `/app` sí hay una visualización de la voz, porque ahora se mide el volumen real con Web Audio: los anillos del micrófono crecen con el nivel de la señal. La regla sigue igual: si algo se mueve, es verdad.
