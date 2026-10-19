# Componentes

Todos son standalone, con `ChangeDetectionStrategy.OnPush`, `input()` / `output()` y signals. Solo usan tokens de `tokens.css`. Se ven en todos sus estados en `/design`.

## La voz (`app/voz/`)

### `VozService`

Servicio (`providedIn: 'root'`) sobre la Web Speech API (`SpeechRecognition` o `webkitSpeechRecognition`).

| Miembro | Tipo | Descripción |
|---|---|---|
| `disponible` | `boolean` | El navegador soporta el dictado. Si es `false`, no se muestra ningún micrófono |
| `escuchando` | `Signal<boolean>` | El micrófono está abierto (enciende REC) |
| `oyendoVoz` | `Signal<boolean>` | El reconocedor detecta voz ahora (`speechstart` / `speechend`) |
| `interino` | `Signal<string>` | Texto que el reconocedor todavía puede cambiar |
| `dictar(idioma = 'es-ES')` | `Promise<string>` | Escucha una frase y la devuelve confirmada. Rechaza con un mensaje en español si no hay permiso, micrófono, voz o conexión; todos ofrecen el teclado |
| `detener()` | `void` | Cierra el micrófono; lo dicho hasta ahí se confirma |

### `correoHablado(texto)`

Función pura: "Ana arroba correo punto com" → `ana@correo.com`. Entiende arroba, punto, guion, guion bajo y barra baja, quita tildes y espacios y acepta lo que Chrome ya entrega con `@` y puntos.

### `Dictado`

Clase (no inyectable) que guarda las líneas del guion y qué bloques están ensamblados.

| Miembro | Descripción |
|---|---|
| `lineas`, `ensamblados`, `enCurso` | Signals con las líneas, los bloques armados y si se está reproduciendo |
| `reproducir(frases)` | Dicta las frases palabra por palabra (110 ms por palabra, 280 ms entre frases). Al confirmar cada una, ensambla su `bloque`. Con movimiento reducido o la pestaña oculta, todo aparece listo |
| `saltar()` | Termina todo de inmediato |
| `reiniciar()` | Borra el guion y desarma los bloques |
| `ensamblado(bloque)` | `true` si el bloque ya está armado |
| `agregar(quien, texto, interino)`, `actualizar(id, cambios)`, `quitar(id)` | Líneas reales: el dictado de la persona o las respuestas de la app |

### `ui-transcripcion`

| Input | Tipo | Descripción |
|---|---|---|
| `lineas` | `LineaTranscripcion[]` (requerido) | `{ id, quien: 'tu' \| 'app', texto, interino? }` |
| `escuchando` | `boolean` | Muestra el piloto REC |
| `oyendoVoz` | `boolean` | El piloto late |
| `vacio` | `string` | Texto cuando no hay líneas |

Lo dicho va en Newsreader entre comillas angulares; lo interino, en gris e itálica; las respuestas de la app, en la letra de la interfaz. Quién habla solo se repite cuando cambia. En pantallas angostas muestra las dos últimas frases.

## El estudio (`app/estudio/componentes/`, `app/vista-previa/`)

### `ui-microfono`

| Input / output | Tipo | Descripción |
|---|---|---|
| `escuchando` | `boolean` | Pasa a REC y muestra los anillos |
| `nivel` | `number` (0 a 1) | Volumen real del micrófono (`NivelMicrofono`); escala los anillos con `--nivel` |
| `compacto` | `boolean` | 72 px, en el mando; si no, de 96 a 132 px |
| `deshabilitado` | `boolean` | Mientras la IA trabaja |
| `pulsar` (output) | `void` | Clic |

`aria-pressed` y `aria-label` («Dictar una orden» o «Dejar de escuchar»). Los anillos y el vúmetro (para movimiento reducido) son `aria-hidden`.

### `ui-orden`

| Input / output | Tipo | Descripción |
|---|---|---|
| `texto` (model) | `string` | La orden, editable |
| `confirmado`, `interino` | `string` | Lo que se está dictando: en tinta y en gris e itálica |
| `escuchando`, `disponible` | `boolean` | Sin Web Speech API muestra el aviso de teclado y oculta el selector de variante |
| `idioma` | `string` | Variante del español elegida |
| `enviando`, `etiquetaEnviar` | `boolean`, `string` | «Crear la página» o «Aplicar el cambio» |
| `enviar` (output) | `string` | Enter o el botón (Mayús + Enter es salto de línea) |
| `cambiarIdioma` (output) | `string` | El código de la variante |

### `ui-ejemplos`

`frases: string[]` → `elegir` (output) con la frase. Botones en Newsreader, entre comillas.

### `ui-construccion`

`progreso: Progreso` (texto, bloques que llegaron, caracteres, `sinStream`, `desdeCache`) y `orden`. Solo el texto de estado es `role="status"`.

### `ui-linea-tiempo`

| Input / output | Tipo | Descripción |
|---|---|---|
| `versiones`, `actual` | `Version[]`, `number \| null` | La actual con `aria-current` |
| `puedeDeshacer`, `puedeRehacer` | `boolean` | Deshabilitados con borde discontinuo |
| `irA`, `deshacer`, `rehacer` (outputs) | `number`, `void`, `void` | |

Muestra el número, la orden, la hora, «desde la N» en una rama y «sin guardar».

### `ui-ventana`

| Input / output | Tipo | Descripción |
|---|---|---|
| `documento` | `string \| null` | Un documento de `documentoVistaPrevia()` (saneado y con CSP) |
| `nombre` | `string` | En la barra y en el título del iframe |
| `vacio` | `string` | Texto del lienzo sin documento |
| `ancho` (model) | `'movil' \| 'tablet' \| 'escritorio'` | 375 px, 768 px o 100 % |

Iframe con `sandbox=""`. Contenido proyectado: el progreso que flota encima.

### `app-barra`

La barra de `/app` y `/proyectos`: marca, «Mis proyectos», tema, usuario y cerrar sesión.

## Base (`app/ui/`)

### `ui-button`

| Input | Tipo | Por defecto |
|---|---|---|
| `variante` | `'primario' \| 'secundario' \| 'fantasma' \| 'peligro'` | `'primario'` |
| `tipo` | `'button' \| 'submit'` | `'button'` |
| `tamano` | `'normal' \| 'compacto'` | `'normal'` (48 px; compacto 44 px) |
| `cargando` | `boolean` | `false` |
| `textoCargando` | `string` | `'Cargando…'` |
| `deshabilitado` | `boolean` | `false` |
| `anchoCompleto` | `boolean` | `false` |
| `etiqueta` | `string \| null` | Para botones de solo ícono |

Estados: hover (solo con puntero), foco (anillo ultramar), presionado (98 %), deshabilitado (50 %), cargando (el texto cambia a `textoCargando` en un `role="status"`, tres puntos esperan, `aria-busy` y el clic no hace nada).

### `ui-text-field`

Compatible con Reactive Forms (`ControlValueAccessor`).

| Input | Tipo | Descripción |
|---|---|---|
| `label` | `string` (requerido) | Visible, arriba |
| `tipo` | `'text' \| 'email'` | |
| `autocomplete`, `icono`, `ayuda`, `maxlength` | | |
| `error` | `string \| null` | Activa `aria-invalid` y reemplaza la ayuda |
| `requerido` | `boolean` | `aria-required="true"` |
| `conAccion` | `boolean` | Reserva espacio a la derecha para un botón proyectado con `[campo-accion]` |
| `multilinea`, `opcional` | `boolean` | |

Slot `[campo-accion]`: un botón dentro del campo (el micrófono del correo y de la pregunta a la IA).

### `ui-password-field`

`label`, `autocomplete`, `ayuda`, `error`, `requerido` y `conMedidor`. Botón de mostrar u ocultar con `aria-label` y `aria-pressed`, sin perder el foco ni el cursor. Aviso de Bloq Mayús con `aria-live`.

### `ui-strength-meter`

`password: string`. Cuatro bloques que se completan según el nivel; el texto ("Fortaleza: …") es la información y se anuncia con `aria-live`.

### `ui-alert`

`tipo: 'error' | 'exito' | 'info' | 'aviso'`, `titulo`. Borde lateral, ícono y texto. Errores con `role="alert"`; el resto, `role="status"`.

### `ui-avatar`, `ui-icon`, `ui-theme-toggle`

- `ui-avatar`: `iniciales` en un círculo ultramar, `aria-hidden`.
- `ui-icon`: `nombre`, íconos de función, ahora también `microfono`. Siempre decorativos.
- `ui-theme-toggle`: un fader de consola. La perilla arriba es la luz encendida (claro) y abajo, la cabina a oscuras. `aria-label` dice a qué modo cambia.

## Plantilla

### `app-auth-layout`

Slots: `[auth-guion]` (la transcripción, en una `section` "Lo que se dictó"), `[auth-encabezado]`, el contenido por defecto y `[auth-pie]` (dentro de `<main>`). Sin métodos públicos: el acceso ya no se sacude ni celebra.

## En las páginas

- **Bloque de maqueta** (`.bloque` / `.bloque--maqueta` en `acceso.css` y en la guía): un rectángulo gris sobre el componente real, con `pointer-events: none`. El control de abajo funciona igual; al enfocarlo, el dictado termina.
- **Micrófono** (`.mic`): botón de 44 × 44 px dentro del campo, con `aria-pressed` y `aria-label` "Dictar el correo" o "Dejar de dictar". Con el micrófono abierto es rojo REC.
