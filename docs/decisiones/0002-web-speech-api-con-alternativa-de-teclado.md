# 0002 · Web Speech API, siempre con alternativa de teclado

- **Estado:** aceptada
- **Fecha:** 2026-10-12

## Contexto
El producto se usa hablando. Hay servicios de reconocimiento de pago y librerías, pero la Web Speech API ya viene en Chrome, Edge y Safari, sin costo ni claves. Firefox no la soporta, y hay personas que no pueden o no quieren hablar.

## Decisión
Usar la Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) en español (`es-ES`) detrás de `VozService`, con resultados interinos. Reglas:
1. Sin soporte, no se muestra ningún micrófono.
2. Lo dictado llena el mismo campo que se puede escribir, y queda visible y editable.
3. Cada error (sin permiso, sin micrófono, sin voz, sin red) se explica y ofrece el teclado.
4. Un correo dictado se convierte con `correoHablado` ("arroba" → `@`, "punto" → `.`).

## Consecuencias
- Sin dependencias ni costos. Los tipos de la API se declaran a mano porque no todos los navegadores los traen.
- Chrome envía el audio a los servidores de Google para reconocerlo; el dictado necesita conexión. Hay que decirlo en la documentación del producto.
- La API no se puede probar en un navegador sin micrófono: las pruebas automáticas la simulan.
