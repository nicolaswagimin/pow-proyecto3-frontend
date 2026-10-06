# Brief de diseño · Proyecto 3 · Hora Dorada

## Encargo
- **Pantalla:** acceso (login y registro). Trabajo principal: que alguien entre o cree su cuenta en segundos, y que la primera impresión sea espectacular.
- **Quién la usa:** un profesor evaluando el proyecto (escritorio) y cualquier persona desde el móvil.
- **Qué debe sentir:** calidez, brillo, celebración (como llegar a casa al atardecer).
- **Restricciones:** contraste AA, `prefers-reduced-motion`, 60 fps (solo `transform`/`opacity`), modo claro/oscuro, sin librerías de UI. El tema del proyecto aún no se conoce: el nombre vive en `nombreApp`.
- **Prioridad del usuario:** muchas animaciones en todos los elementos (sustituye la regla de "un solo momento memorable").

## Dirección elegida: Hora Dorada
Un atardecer en el desierto con brillo holográfico: colores cálidos que se mueven como calor sobre la arena, y una tarjeta con reflejo iridiscente como una lámina coleccionable.

### Paleta (contraste verificado)
| Token | Claro (tarde) | Oscuro (crepúsculo) |
|---|---|---|
| fondo | `#FFE9DC` | `#1B0B24` |
| superficie | `#FFF8F3` | `#2A1436` |
| texto | `#2A1033` (14.7:1) | `#FFF1E8` (17:1) |
| texto-2 | `#6B4A6E` (7.1:1) | `#D9B8C9` (9.3:1) |
| primario (degradado) | `#FF7A59` → `#FFB627`, texto `#2A1033` (6.7:1 o más) | `#FF7A6B` → `#FFC94A`, texto `#1B0B24` (7.4:1 o más) |
| acento | `#C2185B` (5.6:1) | `#FF4F8B` |
| error | `#B3122E` | `#FF8FA0` |
| éxito | `#2E7D32` | `#7BE0A0` |

### Tipografía (solo estos pesos)
- **Bricolage Grotesque** 600 y 800: títulos. Expresiva, cálida e irregular.
- **DM Sans** 400, 500 y 700: texto, labels y botones.

### Composición
Escritorio (pantalla dividida)
```
┌──────────────────────────────┬───────────────────────────────┐
│ ☀ nombreApp                  │                      [tema]   │
│        .-""""-.              │   Hola otra vez               │
│      /  ☀ ☀   \  rayos       │   Entra para seguir           │
│     |  sol que  | girando    │   ╔ Correo ═══════════════╗   │
│      \ respira /             │   ╚═══════════════════════╝   │
│        '-....-'              │   ╔ Contraseña ════════ 👁 ╗   │
│  ～～～～～～～～～～～～～～  │   ╚═══════════════════════╝   │
│ ～～ dunas ondulando ～～～～ │   [▓▒░ Iniciar sesión ░▒▓]   │
│ ～～～～～～～～～～～～～～～ │   ¿Sin cuenta? Crear una     │
└──────────────────────────────┴───────────────────────────────┘
          (en registro, el panel del sol se desliza a la derecha)
```
Móvil
```
┌────────────────────┐
│ ☀ nombreApp  [tema]│
│    .-""-.  ☀       │
│ ～～～ dunas ～～～ │
├────────────────────┤
│ Hola otra vez      │
│╔ Correo ═════════╗ │
│╚═════════════════╝ │
│╔ Contraseña ══ 👁╗ │
│╚═════════════════╝ │
│[▓ Iniciar sesión ▓]│
│ Crear una cuenta   │
└────────────────────┘
```

### Animaciones
- **Fondo:** malla de degradados en CSS con blobs cálidos difuminados que se mueven, tres capas de dunas en SVG que ondulan (dos en móvil) y un sol que respira con rayos girando.
- **Entrada:** amanecer orquestado. El sol sube desde detrás de las dunas, el cielo pasa de ciruela a durazno y los campos aparecen de abajo hacia arriba con un desenfoque que se aclara.
- **Tarjeta:** reflejo holográfico con un brillo `conic-gradient` que sigue al mouse y una inclinación 3D sutil.
- **Login ↔ registro:** el panel del sol cruza de lado con una curva de resorte que se pasa un poco y vuelve, y el formulario entra desde el lado contrario. En móvil, la banda del sol se pliega y se despliega.
- **Campos:** label flotante con desenfoque, borde degradado cónico que gira al enfocar y un ícono que sube y brilla.
- **Botón:** un destello recorre el degradado y este se desplaza en continuo. Al enviar se transforma en un sol que gira con rayos que laten.
- **Medidor de contraseña:** un sol que sube por el arco del horizonte, con el cielo pasando de ciruela a dorado.
- **Mostrar contraseña:** ojo con pupila-sol; al abrirlo, los rayos se expanden.
- **Error:** sacudida tipo espejismo con un temblor y distorsión breve, y el mensaje se aclara desde un desenfoque con resplandor rosa.
- **Éxito:** estallido solar con rayos radiales, fuegos artificiales de partículas doradas y un check dentro de un sol.
- **Bienvenida en `/app`:** amanecer detrás del avatar y el nombre con un barrido dorado.
- **Tema:** el sol se pone tras una duna y sale la luna con estrellas que titilan (y al revés).

### Rendimiento y accesibilidad
- Los blobs y las dunas se pausan con `visibilitychange`, y hay menos capas en móvil.
- El brillo holográfico se actualiza dentro de `requestAnimationFrame`.
- En dispositivos táctiles se desactivan la inclinación 3D y el brillo que sigue al cursor.
- Con `prefers-reduced-motion`, el cielo queda estático, el panel cambia con un fundido y no hay fuegos artificiales.
- El tema recuerda la elección en `localStorage`; la primera vez usa `prefers-color-scheme`.

## Textos
- Login: "Hola otra vez" / "Entra para seguir donde lo dejaste". Botón "Iniciar sesión". Enlace "¿Sin cuenta? Crear una".
- Registro: "Crea tu cuenta" / "Tu lugar está listo". Botón "Crear cuenta". Enlace "¿Ya tienes cuenta? Inicia sesión".
- Errores: los mismos mensajes que en el resto del sistema (credenciales, correo duplicado, contraseña corta, correo inválido, servidor caído, demasiados intentos).

## Direcciones de los otros proyectos (no reutilizar aquí)
- **Bioluminiscencia (Proyecto 1):** océano nocturno con plancton en canvas, vidrio cáustico, morph líquido y burbujas.
- **Constructiva (Proyecto 2):** póster Bauhaus con geometría primaria, giro 3D de dos caras y confeti geométrico.

## Cómo re-tematizar
- Cambia los dos extremos del degradado primario y el acento en `src/styles/tokens.css`. El cielo, las dunas y los fuegos artificiales usan esos tokens.
- Cambia las familias en `--font-display` y `--font-texto`.
- Cambia `nombreApp` y los textos del saludo.
