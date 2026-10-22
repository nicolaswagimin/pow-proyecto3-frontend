# Arquitectura del frontend

Angular 22 con componentes standalone, signals y `ChangeDetectionStrategy.OnPush` en todos los componentes. Sin SSR ni librerías de UI o de voz: CSS plano y la Web Speech API del navegador.

## Carpetas

```
src/
  index.html               título, fuentes (Schibsted Grotesk y Newsreader) y tema guardado antes de pintar
  main.ts                  arranque con appConfig
  styles.css               importa los tres archivos de styles/
  styles/
    tokens.css             todos los tokens de diseño (único archivo para re-tematizar)
    base.css               reset, foco visible, movimiento reducido
    utilities.css          .visually-hidden y .stack
  environments/            URL del backend en desarrollo y en producción
  app/
    app.config.ts          HttpClient con el interceptor y router con input binding
    app.routes.ts          rutas (ver abajo)
    config.ts              APP_NOMBRE = 'VoiceToWeb'
    core/                  sesión, guards, interceptor, errores, tema, fortaleza, movimiento
    services/
      paginas.service.ts   generar y editar con fetch leyendo el stream NDJSON, con alternativa ?stream=0
      proyectos.service.ts proyectos y versiones (HttpClient)
    voz/
      voz.service.ts       Web Speech API: dictar() (acceso) y escucharOrden() en es-CO y otras variantes
      nivel-microfono.ts   volumen real con Web Audio (getUserMedia + AnalyserNode)
      comandos.ts          deshacer, rehacer, nueva página y descargar, sin IA
      correo-hablado.ts, dictado.ts, transcripcion.ts   el guion del acceso
    vista-previa/
      sanear.ts            saneado a punto fijo, CSP y marcas de cambio y entrada
      ventana.ts           ui-ventana: marco de navegador con anchos e iframe sandbox=""
    estudio/               el producto
      bloques.ts           bloques data-vtw de una página a medio llegar y diferencias entre versiones
      versiones.ts         árbol de versiones: deshacer, rehacer, agregar
      estudio-estado.ts    EstudioEstado: orden, construcción, versiones, guardado, comandos y errores
      componentes/         ui-microfono, ui-orden, ui-ejemplos, ui-construccion, ui-linea-tiempo
    ui/                    componentes base (botón, campos, medidor, alerta, avatar, íconos, tema)
    layouts/
      auth-layout/         plantilla de acceso: guion y maqueta
      barra/               app-barra: marca, Mis proyectos, tema, usuario y salir
    pages/
      acceso/              login y registro (un solo componente): guion, bloques y dictado del correo
      inicio/              /app: el estudio
      proyectos/           /proyectos: abrir, renombrar y borrar
      guia/                /design
```

**`EstudioEstado`** (provisto en `Inicio`) es el centro de `/app`. Recibe la orden (dictada con `VozService` y medida con `NivelMicrofono`, o escrita), decide si es un comando, y si no la manda a `PaginasService`. Con cada trozo que llega arma el documento parcial (`bloquesCompletos`, `documentoParcial`), y al terminar agrega la versión, la guarda con `ProyectosService` y resalta lo que cambió (`diffBloques`). Los componentes solo pintan y emiten.

## Rutas

| Ruta | Componente | Guard | Qué muestra |
|---|---|---|---|
| `/` | — | — | Redirige a `/app` con sesión o a `/login` sin ella |
| `/login`, `/registro` | `Acceso` (carga diferida) | `invitadoGuard` | Un solo componente para los dos: el modo llega como input desde la URL (`rutaAcceso`), así el cambio se dicta ("Agrega un campo para el nombre") en lugar de recargar |
| `/app` | `Inicio` (carga diferida) | `authGuard` | El estudio: micrófono, orden, ventana con la página, versiones y acciones. `?proyecto=<id>` abre uno guardado |
| `/proyectos` | `Proyectos` (carga diferida) | `authGuard` | Proyectos guardados: abrir, renombrar y borrar |
| `/design` | `Guia` (carga diferida) | — | Guía de estilo viva. No se enlaza desde la app |
| `**` | — | — | Redirige a `/` |

`withComponentInputBinding()` pasa `modo` y `?sesion=expirada` como inputs del componente.

## Servicios

| Archivo | Qué hace |
|---|---|
| `core/auth.service.ts` | `login`, `registrar`, `refrescarUsuario` y `cerrarSesion`. Guarda token y usuario en `localStorage` (con `try/catch`: en modo privado la sesión dura la pestaña) y los expone como signals. `estaAutenticado()` revisa la expiración del JWT en cada navegación. |
| `services/paginas.service.ts` | `generar(orden, alEvento)` y `editar(html, orden, alEvento)`: `fetch` que lee el NDJSON línea por línea y entrega cada evento. Pasa sola a `?stream=0` si no llega un byte en 12 s, si el stream se corta sin `final` o si un proxy responde 502/503/504 sin JSON ([ADR 0008](decisiones/0008-construccion-en-vivo.md)). Maneja el token y el 401 por su cuenta (el interceptor solo ve `HttpClient`). |
| `services/proyectos.service.ts` | `listar`, `obtener`, `crear`, `agregarVersion`, `renombrar` y `eliminar`. |
| `core/tema.service.ts` | Tema claro u oscuro. La primera vez sigue al sistema; después recuerda la elección. Aplica `data-theme` en `<html>` dentro de una View Transition. |
| `core/errores.ts` | `mapearError(err, contexto)`: el único lugar donde las respuestas del backend se convierten en mensajes (0, 400, 401, 409, 429, 502, 5xx). |
| `core/fuerza.ts` | Nivel de fortaleza de una contraseña y su pista. |
| `core/movimiento.ts` | `prefiereMenosMovimiento()` y `leerToken()`. |
| `voz/voz.service.ts` | `dictar()` (una frase, para el acceso), `escucharOrden()` (continua, con interinos), `detener()`, `idioma` y `cambiarIdioma()`, y los signals `disponible`, `escuchando`, `oyendoVoz`, `interino` y `confirmado`. Ver [voz.md](voz.md). |
| `voz/nivel-microfono.ts` | `abrir()`, `cerrar()` y la signal `nivel` (de 0 a 1). |

## Guards

- `authGuard`: deja pasar solo con sesión válida; si no, redirige a `/login`.
- `invitadoGuard`: login y registro son solo para quien no tiene sesión; con sesión, redirige a `/app`.

## Interceptor

`core/auth.interceptor.ts`:
1. Agrega `Authorization: Bearer <token>` a las peticiones al backend, salvo las públicas (`/auth/login`, `/auth/registro`, `/health`).
2. Si una ruta protegida responde 401, cierra la sesión y lleva a `/login?sesion=expirada`, donde el acceso muestra "Tu sesión expiró".

## Flujo de un login

1. (Opcional) La persona dicta el correo: `VozService.dictar()` devuelve la frase y `correoHablado` la convierte antes de llenar el campo.
2. `Acceso` valida el formulario. Si hay errores, enfoca el primer campo inválido y anuncia el resumen.
3. El botón pasa a cargando ("Iniciando sesión…", `aria-busy`).
4. `AuthService.login` hace `POST /api/auth/login`. Si tarda más de 4 s, aparece "El servidor está despertando" (Render gratuito).
5. Si sale bien, se guarda la sesión, el guion responde "Sesión iniciada. Entrando…" y se navega a `/app`.
6. Si sale mal, `mapearError` traduce el error: va junto al campo o en una alerta, y también queda en el guion.

## Flujo de una página

1. La persona pulsa el micrófono: `VozService.escucharOrden()` y `NivelMicrofono.abrir()`. Los anillos siguen `nivel` y la transcripción, `confirmado` e `interino`.
2. Al terminar, lo dicho queda en «Tu orden». Un comando se ejecuta enseguida.
3. «Crear la página» llama a `EstudioEstado.enviar()` y este a `PaginasService.generar()`. Cada `parcial` se acumula; cuando cierra un bloque, `documentoParcial()` arma un documento nuevo y `ui-ventana` lo muestra, saneado, en el iframe sin permisos.
4. El `final` crea la versión 1 y `ProyectosService.crear()` la guarda.
5. Una orden nueva llama a `editar()` con el HTML actual. La página se queda visible con el progreso encima; al terminar, la nueva versión se resalta (`diffBloques`) y se guarda con su `base_id`.

## Pruebas

`npm test` corre Vitest con jsdom (`@angular/build:unit-test`, configuración en `vitest-base.config.mts`): 114 pruebas. Cubren:
- el saneado (XSS, mXSS, CSS, fuentes, punto fijo);
- la ventana (sandbox `""`);
- los bloques a medio llegar y su diferencia;
- el árbol de versiones y los comandos;
- la voz (reconocedor, Web Audio y errores simulados);
- `PaginasService` (stream partido, cortes, búfer del proxy, errores);
- `EstudioEstado` en todo el flujo;
- cada componente, `/app` y `/proyectos`.

Lo que jsdom no puede hacer (render real, voz, micrófono, iframes) se verificó con Playwright sobre Chrome.

## Configuración

- Puerto fijo 4203 en `angular.json` (los tres proyectos corren a la vez).
- Budgets de producción: inicial 500 kB (aviso) y 1 MB (error); estilos por componente 8 kB (aviso) y 12 kB (error).
- `vercel.json` reescribe todas las rutas a `index.html`.
