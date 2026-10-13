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
    services/api.service.ts   /health, /items y /ia
    voz/                   VozService (Web Speech API), correoHablado, Dictado y ui-transcripcion
    ui/                    componentes base (botón, campos, medidor, alerta, avatar, íconos, tema)
    layouts/auth-layout/   plantilla de acceso: guion y maqueta
    pages/
      acceso/              login y registro (un solo componente): guion, bloques y dictado del correo
      inicio/              /app: guion de la sesión y preguntas a la IA por voz
      guia/                /design
```

La voz está separada en tres piezas: `VozService` habla con el navegador y expone signals (escuchando, oyendo voz, texto interino); `Dictado` guarda las líneas del guion y qué bloques están armados; `ui-transcripcion` solo pinta. Las páginas los conectan: el acceso reproduce su guion y dicta el correo, y `/app` dicta preguntas para la IA. El producto usará las mismas piezas para dictar órdenes que Gemini convierta en HTML.

## Rutas

| Ruta | Componente | Guard | Qué muestra |
|---|---|---|---|
| `/` | — | — | Redirige a `/app` con sesión o a `/login` sin ella |
| `/login`, `/registro` | `Acceso` (carga diferida) | `invitadoGuard` | Un solo componente para los dos: el modo llega como input desde la URL (`rutaAcceso`), así el cambio se dicta ("Agrega un campo para el nombre") en lugar de recargar |
| `/app` | `Inicio` (carga diferida) | `authGuard` | Guion de la sesión, preguntas a la IA por voz, estado y registros |
| `/design` | `Guia` (carga diferida) | — | Guía de estilo viva. No se enlaza desde la app |
| `**` | — | — | Redirige a `/` |

`withComponentInputBinding()` pasa `modo` y `?sesion=expirada` como inputs del componente.

## Servicios

| Archivo | Qué hace |
|---|---|
| `core/auth.service.ts` | `login`, `registrar`, `refrescarUsuario` y `cerrarSesion`. Guarda token y usuario en `localStorage` (con `try/catch`: en modo privado la sesión dura la pestaña) y los expone como signals. `estaAutenticado()` revisa la expiración del JWT en cada navegación. |
| `services/api.service.ts` | `estado()` (`GET /health`), `listar`, `crear` y `eliminar` items, `preguntarIA`. |
| `core/tema.service.ts` | Tema claro u oscuro. La primera vez sigue al sistema; después recuerda la elección. Aplica `data-theme` en `<html>` dentro de una View Transition. |
| `core/errores.ts` | `mapearError(err, contexto)`: el único lugar donde las respuestas del backend se convierten en mensajes (0, 400, 401, 409, 429, 502, 5xx). |
| `core/fuerza.ts` | Nivel de fortaleza de una contraseña y su pista. |
| `core/movimiento.ts` | `prefiereMenosMovimiento()` y `leerToken()`. |
| `voz/voz.service.ts` | `dictar()`, `detener()` y los signals `disponible`, `escuchando`, `oyendoVoz` e `interino`. |

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

## Configuración

- Puerto fijo 4203 en `angular.json` (los tres proyectos corren a la vez).
- Budgets de producción: inicial 500 kB (aviso) y 1 MB (error); estilos por componente 8 kB (aviso) y 12 kB (error).
- `vercel.json` reescribe todas las rutas a `index.html`.
