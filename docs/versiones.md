# Versiones · VoiceToWeb

Cada orden que cambia la página crea una **versión** con la orden que la produjo, el HTML resultante y su hora. Se guardan en el servidor (`versiones`, ver `base-de-datos.md` del backend) y **ninguna se borra**.

Código: `estudio/versiones.ts` (funciones puras), `estudio/estudio-estado.ts` (la versión actual y el guardado) y `estudio/componentes/linea-tiempo.ts`.

## Un árbol, no una pila

Cada versión guarda su **`base_id`**: la versión de la que salió (`null` en la primera). Un ejemplo:

```
1 «una cafetería en Pasto»
├── 2 «título azul»
│   └── 3 «agrega contacto»
└── 4 «fondo verde»            ← se editó desde la 1
```

| Acción | Qué hace |
|---|---|
| **Deshacer** | Va a `base_id` de la actual (de la 3 a la 2, de la 4 a la 1) |
| **Rehacer** | Va a la versión **más reciente** que salió de la actual (de la 1 a la 4, la última rama que se siguió). Cuenta el orden de creación, no el id: las no guardadas tienen ids negativos |
| **Volver a una versión** | Un clic en la línea de tiempo la muestra. No crea nada |
| **Una orden nueva** | Crea una versión cuyo `base_id` es **la que se está viendo**, aunque no sea la última. Se agrega al final de la lista |

Con una pila clásica, editar después de deshacer borra las versiones «de adelante». Aquí no se pierde ninguna: la 2 y la 3 siguen en la lista aunque se haya editado desde la 1. Ver [decisiones/0007](decisiones/0007-versiones-en-arbol.md).

## La línea de tiempo

- Lista las versiones en el orden en que se crearon, con su número, la orden (en Newsreader) y la hora.
- La actual va marcada con `aria-current="true"` y el número relleno.
- Una versión que no salió de la inmediatamente anterior dice de cuál salió («desde la 1»).
- Las que todavía no se guardaron dicen «sin guardar».
- Los botones Deshacer y Rehacer se deshabilitan cuando no hay adónde ir (borde discontinuo, no solo color).

## Qué cambió

Al pasar de una versión a otra (por una orden, deshacer, rehacer o volver), se comparan los bloques `data-vtw` de las dos (`diffBloques`):

- los **cambiados** y los **nuevos** se resaltan en la ventana;
- se anuncia en `role="status"`, por ejemplo: «Deshecho: volviste a la versión 1. Cambió: Contacto (quitado).».

## Guardado

- Una versión aparece en la lista **apenas llega**, con un id temporal negativo, y se guarda en orden.
- La primera crea el proyecto (`POST /api/proyectos`), y las siguientes se agregan con su `base_id` (`POST /api/proyectos/:id/versiones`).
- Al guardar, el id temporal se reemplaza por el real, también en los `base_id` que lo apuntaban.
- Si no se puede guardar, la versión se queda y se ve «Sin guardar» con «Reintentar guardar», que manda las pendientes en orden.
- Los guardados van **en cola**: «Reintentar guardar» mientras se guarda una orden no duplica proyectos ni versiones.
- «Nueva página» y abrir otro proyecto cortan la orden en curso (`AbortSignal`). Lo que el servidor responda después de un guardado anterior no se mezcla con la página nueva.
- Si hay versiones **sin guardar**, «Nueva página» (botón o voz) y abrir un proyecto piden confirmación antes de descartarlas.

## Pruebas

- `versiones.spec.ts`: deshacer y rehacer en un árbol con ramas, agregar desde una versión vieja sin perder ninguna, ida y vuelta.
- `estudio-estado.spec.ts`: deshacer, rehacer y volver a una versión, editar desde ahí, el guardado fallido y su reintento, dos guardados a la vez, «Nueva página» durante un guardado, la confirmación y el corte de la orden en curso.
