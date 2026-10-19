# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Los commits siguen Conventional Commits.

## [Sin publicar] · 2026-10-19 · Funcionalidad completa

El estudio de VoiceToWeb: dictar una página, verla armarse en vivo y cambiarla con la voz.

### Agregado
- **`/app` rediseñado** alrededor de un gran micrófono:
  - anillos que siguen el volumen real (Web Audio);
  - transcripción palabra por palabra, editable antes de enviar;
  - variante del español (es-CO por defecto);
  - ejemplos de un clic;
  - aviso y teclado cuando no hay Web Speech API.
- **Ventana de navegador** con el nombre del proyecto y los anchos móvil, tablet y escritorio. Iframe `sandbox=""` sin ningún permiso, con saneado a punto fijo y CSP sin scripts.
- **Construcción en vivo:** la página se arma por bloques `data-vtw` a medida que llega el stream de Gemini, con el progreso visible. Si un proxy retiene o corta el stream, hay una alternativa automática (`?stream=0`) que muestra el progreso igual.
- **Edición por voz** con resaltado de los bloques que cambiaron y su anuncio.
- **Versiones en árbol:** volver a cualquiera, deshacer y rehacer sin perder ninguna.
- **Comandos de control por voz,** sin IA: deshacer, rehacer, nueva página y descargar.
- **Proyectos guardados** automáticamente con todas sus versiones, y la página `/proyectos` (abrir, renombrar y borrar).
- **Descargar y copiar:** el HTML saneado.
- **Errores claros y amables:** micrófono denegado, sin micrófono, sin conexión, cuota, respuesta inválida (con «Reintentar») y sesión.
- **Barra compartida** con «Mis proyectos», e íconos nuevos.
- **107 pruebas** con Vitest y jsdom (`npm test`).
- **Documentación:**
  - nuevos: `funcionalidades.md`, `voz.md`, `vista-previa.md`, `versiones.md` y las ADR 0005 a 0008;
  - actualizados: `arquitectura-frontend.md`, `accesibilidad.md` (28 de 28 auditorías sin violaciones), la ADR 0004 y las capturas.

### Cambiado
- La ADR 0004 se actualiza: la voz se visualiza porque ahora se mide el volumen real.

### Eliminado
- `services/api.service.ts` (items y la pregunta genérica a la IA) y la vieja pantalla de `/app`.

### Corregido
- Angular saneaba `srcdoc` por su cuenta y la página se veía sin estilos.
- Las hojas de Google Fonts se neutralizaban junto con los enlaces.

## 2026-10-12

Rediseño de identidad: de "Hora Dorada" (atardecer sin relación con el tema) a **VoiceToWeb**, con la dirección "Toma de dictado".

### Agregado
- `VozService`: dictado con la Web Speech API en español, con texto interino, estado del micrófono y mensajes de error que ofrecen el teclado.
- `correoHablado`: "ana arroba correo punto com" → `ana@correo.com`.
- `Dictado`: guion que se dicta palabra por palabra y ensambla bloques de la interfaz; se puede saltar y repetir.
- `ui-transcripcion`: lo dicho en Newsreader, texto interino en gris e itálica y piloto REC ligado a eventos reales.
- Login como demostración: la página se arma mientras se dicta su guion; el correo se puede dictar con el micrófono.
- Registro: "Agrega un campo para el nombre" ensambla ese bloque.
- `/app`: guion de la sesión y preguntas a la IA por voz.
- `/design`: transcripción en todos sus estados y un bloque que se ensambla.
- Ícono de micrófono y slot `[campo-accion]` con el input `conAccion` en los campos.
- Documentación en `docs/`: brief, design system, componentes, animaciones, accesibilidad, arquitectura, cuatro ADR y capturas.

### Cambiado
- Tokens: estudio en claro y cabina en oscuro, ultramar, gris interino, gris de maqueta y rojo REC.
- Tipografía: Schibsted Grotesk para la interfaz y Newsreader para la voz.
- Nombre, título, descripción y `theme-color`.
- Campos: label fijo arriba y `aria-required`.
- Botón: carga con texto visible y tres puntos.
- Medidor de contraseña, alerta, avatar y botón de tema (ahora un fader de consola).
- Auth-layout: del guion a la maqueta.

### Eliminado
- Cielo de atardecer, dunas, panel con brillo holográfico, amanecer entre pantallas, estallido de éxito, sol del avatar, magnetismo y onda del botón, entrada en cascada.
- Alias de tokens del atardecer y tokens sin uso.

### Corregido
- Las frases pendientes del guion se mostraban como comillas vacías.
- "Tú" se repetía en cada frase de la transcripción.
- En móvil, la transcripción completa dejaba el formulario fuera de la vista.

## 2026-10-06

- Login y registro con la dirección visual "Hora Dorada".
- Preparación del despliegue en Vercel.
- Base inicial: frontend y backend conectados con base de datos e IA.
