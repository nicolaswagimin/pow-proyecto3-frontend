# Vista previa segura · VoiceToWeb

La página que genera Gemini es **dato no confiable**: aunque el prompt pida que no haya JavaScript, puede venir con algo peligroso, por error o por inyección en la orden. Se muestra con dos defensas independientes.

Código: `vista-previa/sanear.ts` (saneado y documento) y `vista-previa/ventana.ts` (el marco y el iframe).

## 1. Saneado (`sanear`)

Parsea con `DOMParser`, que no ejecuta nada, y quita:

- **Elementos:** `script` (también en SVG), `noscript`, `iframe`, `frame`, `frameset`, `object`, `embed`, `applet`, `base`, `portal` y todo `meta[http-equiv]` (meta refresh incluido).
- **Atributos:** `on*`, `srcdoc` y `formaction`, más las URLs `javascript:` en `href`, `src`, `action`, `xlink:href`, `data`, `poster` y `srcset` (también con espacios, tabuladores o saltos de línea dentro del esquema).
- **Hojas externas:** solo quedan los `<link rel="stylesheet">` de `fonts.googleapis.com`. Se quitan los demás `<link>`, incluidos `prefetch` y `preload`.
- **CSS que ejecuta o carga código** (`expression(`, `javascript:`, `-moz-binding`, `behavior:`), en `<style>` y en atributos `style`.

**A punto fijo.** Serializar y volver a parsear puede convertir texto en elementos (mutation XSS con `noscript`, MathML o `<style>`). Por eso se sanea hasta que el resultado deja de cambiar, como mucho cinco pasadas, y si no se estabiliza, la página no se muestra.

## 2. El iframe sin permisos

- `sandbox=""`, **sin ningún token**: no corren scripts y el documento tiene un origen opaco, sin acceso a la app, su sesión ni su `localStorage`. Tampoco puede enviar formularios, abrir ventanas, navegar la pestaña ni pedir permisos. Una prueba verifica que el atributo sea exactamente `""`.
- **CSP** en el `srcdoc`: `default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:; img-src https: data:`. No hay `script-src`, así que aunque algo se escapara del saneado no podría ejecutarse.
- **La vista previa no navega.** Los enlaces `<a>` y `<area>` que no son anclas internas pasan a `#`. Sin `allow-top-navigation` no podrían salir de la pestaña, pero cargarían otra página dentro del marco.
- **El documento llega entero.** Angular sanea `srcdoc` por su cuenta y le quitaría el `<head>`, los `<style>` y los `data-vtw`: la página se vería sin estilos. Como el documento ya pasó por nuestro saneador y el iframe no tiene permisos, se entrega con `bypassSecurityTrustHtml`. Solo `ventana.ts` lo hace, y solo con documentos que salen de `documentoVistaPrevia()`.

## 3. Lo que agrega la vista previa (`documentoVistaPrevia`)

- La meta CSP, al principio del `<head>`.
- `data-vtw-cambio` en los bloques que cambió la última orden: un contorno ultramar que se desvanece en 1.6 s.
- `data-vtw-entrando` en los bloques que acaban de llegar: una entrada de 420 ms.
- Un `<style data-vtw-vista>` con esas dos animaciones y `@media (prefers-reduced-motion: reduce)`, que las desactiva (el contorno queda fijo).

Nada de esto se guarda ni se descarga.

## 4. Descargar y copiar (`htmlParaDescargar`)

Es la página **saneada**, con sus enlaces originales y sin CSP, marcas ni estilos de la vista previa.

## Pruebas

`sanear.spec.ts`:
- doce cargas de XSS conocidas: `script`, `script` en SVG, `onerror`, `ONCLICK`, `javascript:` con espacios, `iframe`, `srcdoc`, `object` y `embed`, `formaction`, y mXSS con `noscript` y con MathML;
- meta refresh y `base`;
- CSS peligroso;
- que solo queden las fuentes de Google;
- el punto fijo;
- la CSP sin `script-src`;
- los enlaces neutralizados y las fuentes conservadas;
- las marcas.

`ventana.spec.ts`: el sandbox exactamente `""`, el documento entero en el `srcdoc` y los anchos.
