# Accesibilidad

Objetivo: WCAG 2.2 AA en todas las pantallas, en claro y oscuro, en escritorio y móvil. En una app de voz hay una regla más: **todo lo que se puede dictar se puede escribir**.

## Decisiones

### La voz es una opción, nunca la única vía
- El micrófono solo aparece si el navegador soporta la Web Speech API. Sin soporte, la app es un formulario normal.
- Dictar llena el mismo campo que se puede escribir; el resultado queda visible y editable, y el foco vuelve al campo para revisarlo.
- Si falla (sin permiso, sin micrófono, sin voz, sin conexión), el mensaje dice qué pasó y ofrece el teclado, en el guion y en un anuncio `aria-live`.
- El botón del micrófono tiene `aria-label` ("Dictar el correo" o "Dejar de dictar") y `aria-pressed`. Mide 44 × 44 px.
- Al empezar a dictar se anuncia cómo hacerlo: "Escuchando. Di tu correo, por ejemplo: ana arroba correo punto com."

### El dictado de demostración no estorba
- Los campos funcionan desde el primer instante: el bloque gris de maqueta es `pointer-events: none` y está encima del control real, que sigue en el orden de tabulación.
- Enfocar un campo termina el dictado. "Saltar el dictado" y "Repetir el dictado" son botones normales.
- La transcripción no es `aria-live`. Si lo fuera, un lector de pantalla leería cada palabra del guion mientras la persona intenta llenar el formulario. Está en una `section` con nombre ("Lo que se dictó") para leerla cuando se quiera.
- Con movimiento reducido o la pestaña oculta, no hay reproducción: todo aparece listo.

### El estudio (`/app`)
- **Un solo `h1`** por estado: «¿Qué página quieres crear?» antes de la primera página y el nombre del proyecto después. El mando es una `section` con su `h2` («Siguiente orden») y la ventana, una `section` con nombre («Vista previa»).
- **El micrófono** es un botón con `aria-pressed` y `aria-label` («Dictar una orden» o «Dejar de escuchar»), de 96 px o más (72 px en el mando). Los anillos y el vúmetro son `aria-hidden`.
- **La transcripción en vivo no es `aria-live`:** lo dicho termina en el campo «Tu orden», que tiene su etiqueta y su ayuda (`aria-describedby`). Enter envía y Mayús + Enter hace un salto de línea.
- **Los anuncios** (qué cambió, deshacer, rehacer, guardado, copiado) van en una región `role="status"` que no mueve el foco. El progreso de la construcción anuncia solo su texto de estado, no cada carácter.
- **Los errores** van en `ui-alert` con su acción («Reintentar»). Lo escrito nunca se borra.
- **La vista previa** tiene título («Vista previa de <proyecto>»). Los anchos son botones con `aria-pressed` y nombre; en móvil queda solo el ícono, pero el nombre sigue disponible para el lector.
- **La línea de tiempo** marca la versión actual con `aria-current`. Deshacer y Rehacer deshabilitados llevan borde discontinuo, no solo color.
- **`/proyectos`:** cada proyecto es un enlace con su nombre. Renombrar y borrar dicen a qué proyecto se refieren (texto oculto), y borrar pide confirmación en línea, sin diálogo modal.
- **Movimiento:** los anillos, la entrada de bloques, el contorno de los cambios y el cambio de ancho se desactivan con `prefers-reduced-motion`.

### Formularios
- Labels visibles arriba. `aria-required="true"` en los campos obligatorios.
- `autocomplete`: `email`, `current-password`, `new-password`, `name`. `type="email"` con `inputmode="email"`.
- Los errores aparecen al salir del campo la primera vez y se actualizan al escribir. Se enlazan con `aria-describedby`, marcan `aria-invalid` y llevan ícono y texto.
- Al enviar con errores, el foco va al primer campo inválido y un `aria-live` resume qué revisar.
- Los errores del servidor van en `ui-alert` con `role="alert"` y además quedan en el guion.

### Foco y teclado
- `:focus-visible` con anillo ultramar de 3 px; los campos muestran borde de 2 px y anillo por fuera.
- Orden de tabulación del acceso: logo, tema, saltar o repetir el dictado, correo, micrófono, contraseña, mostrar contraseña, botón, enlace a registro.
- Al cambiar entre login y registro, el foco va al título, salvo que la persona ya esté escribiendo.

### Contraste y color
- Todo el texto supera 4.5:1, incluido el interino (4.8:1 en claro y 5.4:1 en oscuro). Tabla en [design-system.md](design-system.md).
- REC no depende del color: dice "REC" y el botón cambia su `aria-label` y `aria-pressed`.
- El estado del sistema en `/app` se dice con texto ("Responde", "No responde", "Sin configurar").

### Movimiento y táctil
- Solo se anima lo que cuenta algo ([animaciones.md](animaciones.md)). Nada depende del cursor.
- Objetivos táctiles de 44 × 44 px o más.

## Verificación

### 2026-10-19 · El estudio, `/proyectos` y la vista previa

axe-core 4.14 (reglas `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` y `wcag22aa`) con Playwright sobre Chrome, en 1440 y 390 px, claro y oscuro: **28 de 28 auditorías con 0 violaciones**.

| Vista | Claro 1440 px | Claro 390 px | Oscuro 1440 px | Oscuro 390 px |
|---|---|---|---|---|
| `/login` | 0 violaciones | 0 | 0 | 0 |
| `/registro` | 0 | 0 | 0 | 0 |
| `/design` | 0 | 0 | 0 | 0 |
| `/app` vacío | 0 | 0 | 0 | 0 |
| `/app` dictando (REC y transcripción en vivo) | 0 | 0 | 0 | 0 |
| `/proyectos` | 0 | 0 | 0 | 0 |
| `/app` estudio (ventana, mando y versiones) | 0 | 0 | 0 | 0 |

El contenido del iframe es la página generada por la IA (contenido de la persona, no de la app), así que se excluye de la auditoría de la app. El prompt le pide a Gemini que sea accesible.

### 2026-10-12 · Identidad y acceso

Herramientas: axe-core 4.14 (reglas `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` y `best-practice`) con Playwright sobre Chrome, más pruebas de teclado, de movimiento reducido, con el backend apagado y con una Web Speech API simulada.

| Ruta | Claro 1440 px | Claro 390 px | Oscuro 1440 px | Oscuro 390 px |
|---|---|---|---|---|
| `/login` | 0 violaciones | 0 | 0 | 0 |
| `/registro` | 0 | 0 | 0 | 0 |
| `/app` (con sesión) | 0 | 0 | 0 | 0 |
| `/design` | 0 | 0 | 0 | 0 |

- **Teclado:** el recorrido con Tab sigue el orden de arriba. Al enviar vacío con Enter, el foco queda en Correo con `aria-invalid="true"`.
- **Movimiento reducido:** el guion aparece completo y el botón ya ofrece "Repetir el dictado".
- **Dictado (simulado):** con resultados interinos y final, el campo queda en `ana@correo.com`, el foco vuelve al campo y se anuncia "Correo dictado: ana@correo.com. Revísalo antes de continuar.". Con el error `not-allowed`, el campo queda vacío y se anuncia "No tengo permiso para usar el micrófono. Puedes escribir con el teclado.". En `/app`, la pregunta dictada llena el campo de la IA.
- **Backend apagado:** el error se muestra en la alerta y en el guion.

Pendiente: probar el dictado con un micrófono real en Chrome y Safari (la prueba automática simula la API), y recorrer el acceso con VoiceOver.
