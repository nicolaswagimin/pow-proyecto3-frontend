# Brief de diseño · VoiceToWeb

## El encargo

- **Producto:** VoiceToWeb, una herramienta de prototipado web por voz. La persona describe en voz alta la página que quiere, la IA genera el HTML y CSS y lo muestra en vivo. Después la modifica con nuevas órdenes ("cambia el título a azul", "agrega un formulario de contacto"). Usa la Web Speech API, con alternativa de teclado.
- **Pantallas de este trabajo:** acceso (login y registro), bienvenida de `/app` y guía `/design`.
- **Trabajo principal del acceso:** que alguien entre o cree su cuenta en segundos y entienda, sin leer un manual, que en esta herramienta se habla y la página se arma.
- **Quién la usa:** personas que quieren prototipar rápido sin escribir código; en la sustentación, el profesor.
- **Qué debe sentir:** que hablar basta, que la herramienta escucha y responde, y que todo se puede hacer también con el teclado.
- **Restricciones:** WCAG 2.2 AA, `prefers-reduced-motion`, modo claro y oscuro, móvil, sin librerías de UI ni de voz.

## El problema que resuelve el rediseño

El diseño anterior ("Hora Dorada": cielo de atardecer, dunas, brillo holográfico y estallido de éxito) era genérico y no tenía nada de voz ni de construcción de páginas.

## Dirección elegida: Toma de dictado

**Del guion a la maqueta.** La pantalla tiene dos partes: la **transcripción** (lo que se dijo) y la **maqueta** (lo que se construyó con eso). El vocabulario es el del reconocimiento de voz real:

- El texto **interino** (lo que el reconocedor todavía puede corregir) va en gris e itálica.
- Al confirmarse, **asienta** en tinta.
- Cada frase confirmada convierte un **bloque de maqueta** (un rectángulo gris) en el componente real.

El único color cálido es el piloto **REC**, que se enciende solo cuando el micrófono escucha de verdad y late solo mientras detecta voz. No hay ondas de audio decorativas.

### Paleta

| Token | Claro (estudio) | Oscuro (cabina) |
|---|---|---|
| fondo / superficie | `#EFF1F5` / `#FFFFFF` | `#121418` / `#1B1E24` |
| texto | `#16181D`: 17.8:1 | `#ECEEF2`: 14.4:1 |
| texto suave | `#4B5263`: 7.8:1 | `#A3A9B8`: 7.1:1 |
| interino | `#6B7280`: 4.8:1 | `#8B92A3`: 5.4:1 |
| primario (ultramar) | `#2F3FD0`, texto blanco 7.7:1 | `#8C98FF`, texto `#121418` 7.1:1 |
| REC | `#C8261B`, texto blanco 5.6:1 | `#FF6B5E`, texto `#121418` 6.6:1 |
| maqueta (decorativo) | `#D5D9E0` | `#2A2E37` |

Contrastes medidos sobre la superficie, que es donde vive todo el texto. La lista completa está en [design-system.md](design-system.md).

### Tipografía

- **Schibsted Grotesk** (400 y 700): la interfaz, lo que se construye.
- **Newsreader** (400, normal e itálica): la voz. Lo dicho se lee como un guion o una cita, entre comillas angulares. La itálica marca lo interino.

Son dos familias claramente distintas y cada una tiene un rol: si algo está en Newsreader, alguien lo dijo.

### Composición

```
Escritorio                                         Móvil
┌───────────────────────────────────────────────┐  ┌──────────────────┐
│ ❝▣ VoiceToWeb                            [⫼]  │  │ ❝▣ VoiceToWeb [⫼]│
│ ┌──────────────────┬────────────────────────┐ │  │ Transcripción    │
│ │ Transcripción REC│                        │ │  │ «…un botón para  │
│ │ Tú               │   Inicia sesión        │ │  │  entrar»         │
│ │ «Quiero una      │   Esta página se arma… │ │  │ «y un enlace…»   │
│ │  página para…»   │   Correo               │ │  │ Repetir dictado  │
│ │ «con un campo    │   [______________][🎙] │ │  │──────────────────│
│ │  para mi correo» │   Contraseña           │ │  │ Inicia sesión    │
│ │ «y otro para la  │   [▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒]   │ │  │ Correo     [🎙]  │
│ │  contraseña…»    │   [▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒]   │ │  │ Contraseña       │
│ │ Saltar el dictado│   ← bloques sin armar  │ │  │ [Iniciar sesión] │
│ └──────────────────┴────────────────────────┘ │  └──────────────────┘
└───────────────────────────────────────────────┘
```

En escritorio el guion va a la izquierda, como el texto de un apuntador. En móvil va arriba y muestra solo las dos últimas frases, para que el formulario quede a la vista.

### El login es una demostración del producto

1. Al abrir el acceso, el guion se dicta solo, frase por frase: «Quiero una página para entrar a mi cuenta, con un campo para mi correo y otro para la contraseña. Abajo, un botón para entrar y un enlace para crear una cuenta.»
2. Cada frase aparece palabra por palabra como texto interino y, al confirmarse, convierte su bloque de maqueta en el componente real.
3. Los campos se pueden usar desde el primer instante: el rectángulo gris no recibe clics y, al enfocar cualquier campo, el dictado termina. Hay botones para saltar y repetir el dictado.
4. **Se puede dictar el correo.** Si el navegador soporta la Web Speech API, el campo tiene un micrófono. Al pulsarlo se enciende REC y lo que dices aparece en el guion como texto interino. "Ana arroba correo punto com" se convierte en `ana@correo.com` y llena el campo. Sin permiso, sin micrófono o sin soporte, la app lo dice y el teclado funciona igual.
5. Al pasar a registro, el guion dicta "Agrega un campo para el nombre" y ese bloque se ensambla: la página se edita por voz.
6. Las respuestas de la app (errores, sesión iniciada) quedan en el guion, en la letra de la interfaz.

### Extensión a `/app`

`/app` usa la misma hoja: a la izquierda, el guion de la sesión; a la derecha, el contenido. "Pregúntale a la IA" sube al primer lugar y suma un micrófono para **dictar la pregunta**: es la primera parte del producto que ya funciona por voz. El estado del sistema se lee con ícono y resultado en texto. Un registro nuevo se ensambla desde un bloque de maqueta.

## Revisión contra lo genérico

| Default genérico | Qué se hizo |
|---|---|
| Onda de audio o ecualizador animado | No hay ondas decorativas. El único indicador de audio es REC, ligado a eventos reales (escuchando, detectando voz). |
| Partículas, auroras, vidrio, confeti | Nada de eso. El fondo es una hoja de estudio. |
| Tarjeta 3D o botón magnético | Ningún efecto de cursor. |
| Serif de alto contraste "editorial" | Newsreader no decora titulares: solo se usa para lo dicho, que es lo que la distingue. |
| Degradado morado-azul de "IA" | Un ultramar plano y un gris de maqueta. |

## Direcciones descartadas

- **Partitura:** la voz como pentagrama y los bloques como notas. Se descartó porque la metáfora musical no tiene que ver con dictar una página y obliga a explicar la notación.
- **Subtítulos de cine:** texto blanco sobre franja negra al pie de la pantalla. Se descartó porque ocupa el lugar del formulario en móvil y su estética de video no ayuda a construir páginas.

## Textos

- Login: "Inicia sesión" / "Esta página se arma con lo que se dicta en el guion. También puedes dictar tu correo." Botón "Iniciar sesión". Enlace "¿No tienes cuenta? Crea una".
- Registro: "Crea tu cuenta" / "El campo del nombre se agregó por dictado." Botón "Crear cuenta".
- Guion: "Saltar el dictado", "Repetir el dictado", "Dictar el correo", "Dejar de dictar".
- Voz: "Escuchando. Di tu correo, por ejemplo: ana arroba correo punto com.", "Correo dictado: … Revísalo antes de continuar.", "No tengo permiso para usar el micrófono. Puedes escribir con el teclado.", "No te escuché. Inténtalo de nuevo o escribe con el teclado."
- Errores del acceso: los mismos de los otros proyectos ("El correo o la contraseña no coinciden.", etc.).
