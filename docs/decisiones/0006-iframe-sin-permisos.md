# 0006 · La vista previa es un iframe sin ningún permiso

- **Estado:** aceptada · **Fecha:** 2026-10-19

## Contexto
La página que genera Gemini se muestra en vivo dentro de la app. Es HTML no confiable: el prompt pide que no traiga JavaScript, pero una respuesta equivocada o una inyección en la orden («agrega un script que…») podrían traerlo. Si se ejecutara en el origen de la app, podría leer el token de sesión de `localStorage`.

## Opciones
1. **Insertar el HTML en la app** (`innerHTML` con el saneador de Angular). Comparte el origen y los estilos: la página rompería el diseño de la app y viceversa.
2. **iframe con `sandbox="allow-scripts"`**, como a11Lens. Allí hacía falta para correr axe dentro; aquí no corre nada.
3. **iframe con `sandbox=""`**, sin ningún permiso, más un saneado propio y una CSP sin scripts.

## Decisión
Opción 3, con tres defensas independientes:
- **Saneado a punto fijo** (`vista-previa/sanear.ts`): quita scripts, marcos, objetos, `<base>`, meta refresh, `on*`, `srcdoc`, `formaction`, `javascript:`, CSS que ejecuta código y hojas que no sean de Google Fonts.
- **`sandbox=""`:** ni scripts, ni mismo origen, ni formularios, ni ventanas, ni navegación de la pestaña.
- **CSP sin `script-src`** dentro del documento. Además, los enlaces que navegan se neutralizan.

Lo que hace falta mostrar (el contorno de lo que cambió, la entrada de un bloque) se hace **solo con CSS** inyectado: no hace falta ningún script dentro del iframe, ni `postMessage`.

## Consecuencias
- Aunque una de las tres defensas fallara, las otras dos impiden que algo se ejecute.
- Las páginas generadas son prototipos estáticos: un menú hamburguesa o un carrusel con JavaScript no funcionarían. El prompt ya pide no usarlo.
- Angular sanea `srcdoc` por su cuenta y quitaría el `<head>` y los estilos, así que `ui-ventana` entrega el documento con `bypassSecurityTrustHtml`. Es seguro solo porque el documento sale de `documentoVistaPrevia()` (saneado) y el iframe no tiene permisos; ningún otro lugar lo hace.
