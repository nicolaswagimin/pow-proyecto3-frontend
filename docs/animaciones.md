# Animaciones

Regla: cada animación cuenta algo del producto (la voz construye la interfaz) o responde a una acción. No hay ondas de audio decorativas, ni efectos de cursor, ni nada en bucle salvo un proceso en curso.

Con `prefers-reduced-motion: reduce`, `base.css` lleva toda duración a 1 ms, y `Dictado` no reproduce el guion: aparece completo, con todos los bloques armados. Con la pestaña oculta pasa lo mismo.

| Animación | Dónde | Qué comunica | Duración | Con movimiento reducido |
|---|---|---|---|---|
| El guion se dicta | `Dictado` + `ui-transcripcion` | Cómo funciona el reconocimiento: cada frase aparece palabra por palabra como texto interino y asienta al confirmarse | 110 ms por palabra, 280 ms entre frases (unos 5 s en total; se puede saltar) | El guion aparece completo |
| Interino a confirmado | `ui-transcripcion` | El reconocedor dejó de corregir: el gris en itálica pasa a tinta | Inmediato al confirmarse | Igual |
| Bloque que se ensambla | `.bloque--maqueta` | La voz construye la interfaz: el rectángulo gris se desvanece y deja el componente real | `--duracion-lenta` | Todos los bloques aparecen armados |
| Campo nombre al pasar a registro | `Dictado` | Editar por voz: "Agrega un campo para el nombre" ensambla su bloque | Una frase | Aparece armado |
| Piloto REC | `ui-transcripcion` | El micrófono está abierto; el piloto late solo mientras detecta voz (eventos reales `speechstart` / `speechend`) | Latido de 900 ms mientras hay voz | Encendido y quieto |
| Micrófono rojo | `.mic--rec` | Se está grabando | Cambio de color | Igual |
| Tres puntos del botón | `ui-button` | La petición sigue en curso, como una frase que aún no termina; acompaña al texto que cambia | Bucle de 1.2 s mientras carga | Puntos quietos; el texto cambia igual |
| Registro que se ensambla | `/app` | Qué cambió en la lista: el registro aparece como bloque de maqueta y se completa | `--duracion-lenta` | Sin transición |
| Registro que sale | `/app` | Se borró | `--duracion-media` | Sin transición |
| Perilla del fader | `ui-theme-toggle` | Bajar o subir la luz del estudio | `--duracion-lenta` | Cambio instantáneo |
| Ojo de la contraseña | `ui-password-field` | Contraseña visible u oculta | `--duracion-lenta` | Cambio instantáneo |
| Cambio de tema | `TemaService` (View Transitions) | Fundido entre los temas | `--duracion-media` | Sin transición |

## Lo que nunca bloquea

El dictado inicial es una demostración y no debe frenar a nadie:
- Los campos se pueden enfocar y usar desde el primer instante (el bloque gris no recibe clics).
- Enfocar cualquier campo del formulario termina el dictado.
- "Saltar el dictado" lo termina; "Repetir el dictado" lo vuelve a reproducir.

## Qué se quitó del diseño anterior y por qué

| Antes | Motivo |
|---|---|
| Cielo de atardecer y dunas animadas de fondo | Decorativos y sin relación con la voz |
| Panel con brillo holográfico y rebote | Cliché genérico |
| Amanecer al cambiar de tema y entre login y registro | Lo reemplaza el bloque que se ensambla por voz, que explica qué cambió |
| Estallido solar al entrar | Decorativo |
| Sol que salía detrás del avatar | Decorativo |
| Magnetismo y onda del botón | Efectos de cursor |
