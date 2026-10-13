# 0003 · Dos familias: Schibsted Grotesk para la interfaz y Newsreader para la voz

- **Estado:** aceptada
- **Fecha:** 2026-10-12

## Contexto
El diseño anterior usaba Bricolage Grotesque y DM Sans por estética. En VoiceToWeb conviven dos cosas distintas en pantalla: lo que alguien dijo y la interfaz que se construye.

## Decisión
- **Newsreader** (400, normal e itálica) solo para lo dicho, entre comillas angulares, como un guion. La itálica marca el texto interino.
- **Schibsted Grotesk** (400 y 700) para todo lo demás, incluidas las respuestas de la app.

## Consecuencias
- La tipografía dice quién habla: si algo está en Newsreader, alguien lo dijo.
- Newsreader no se usa para titulares: se evita el cliché de serif editorial decorativa.
- Se cargan solo los pesos que se usan desde Google Fonts, con `display=swap`.
