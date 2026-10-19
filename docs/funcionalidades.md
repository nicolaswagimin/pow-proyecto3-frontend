# Funcionalidades · VoiceToWeb

La persona describe en voz alta la página que quiere, la mira armarse en una ventana de navegador y la cambia con nuevas órdenes. Todo lo que se hace con la voz se puede hacer también con el teclado.

## 1. El estudio vacío (`/app`)

- **Un gran micrófono en el centro.** Al pulsarlo, se vuelve REC y unos anillos crecen con el **volumen real** del micrófono (ver [voz.md](voz.md)).
- **Transcripción palabra por palabra** en la letra de la voz (Newsreader): lo confirmado en tinta, lo interino en gris e itálica.
- **Revisar antes de enviar.** Lo dictado queda en el campo «Tu orden» para corregirlo; «Crear la página» o Enter lo envía.
- **Sin Web Speech API** (Firefox) no hay micrófono: un aviso lo explica y el campo de texto hace lo mismo.
- **Variante del español:** Colombia por defecto, con México, España, Argentina, Chile, Perú y Estados Unidos. Se recuerda.
- **Ejemplos de un clic:** cuatro frases que se envían como orden («Una landing para una cafetería en Pasto con menú y contacto»…).

## 2. La ventana de navegador

La página generada se ve en un marco tipo navegador:
- una barra con tres puntos y el nombre del proyecto;
- botones **Móvil** (375 px), **Tablet** (768 px) y **Escritorio** (todo el ancho), con `aria-pressed`;
- un iframe **sin ningún permiso** con la página saneada (ver [vista-previa.md](vista-previa.md)). La vista previa no ejecuta nada ni navega.

## 3. Construcción en vivo

Mientras Gemini escribe, la página **se arma por bloques**: cada bloque `data-vtw` (encabezado, menú, secciones, pie) aparece en la ventana cuando termina de llegar, en orden y con una entrada breve. Un panel de progreso muestra:
- qué está pasando: «Pidiendo la página a la IA…», «Armando la página…», «La IA se equivocó; se lo pido de nuevo…»;
- los bloques que ya llegaron (✓ Encabezado · ✓ Menú…);
- cuántos caracteres van.

Si la conexión no deja ver el stream (un proxy lo retiene), la página llega completa y se arma igual por bloques, con el aviso «sin vista en vivo» (ver [decisiones/0008](decisiones/0008-construccion-en-vivo.md)). Si viene de la caché, se dice «desde la caché».

Con movimiento reducido, los bloques aparecen sin animación.

## 4. Edición por voz

Con una página a la vista, el mando de la derecha (abajo, en móvil) recibe la siguiente orden: «cambia el título a azul», «agrega un formulario de contacto».
- La página actual sigue visible mientras la IA trabaja, con el progreso encima.
- Al terminar, **lo que cambió se resalta** con un contorno ultramar que se desvanece en 1.6 s, y se anuncia: «Cambió: Encabezado, Contacto (nuevo).». Si solo cambiaron los estilos generales, también se dice.

## 5. Versiones

Cada orden crea una versión con la orden que la produjo y su hora (ver [versiones.md](versiones.md)).
- **Volver** a cualquiera con un clic en la línea de tiempo.
- **Deshacer** va a la versión de la que salió la actual; **rehacer**, a la más reciente que salió de ella.
- Editar desde una versión vieja crea una rama («desde la 1»). **Ninguna versión se borra.**

## 6. Comandos de control por voz

Se resuelven en el navegador, sin IA, y solo si son la frase completa (ver [voz.md](voz.md#comandos)):

| Comando | Variantes |
|---|---|
| Deshacer | «deshacer», «deshaz eso», «vuelve atrás», «atrás» |
| Rehacer | «rehacer», «rehaz», «adelante» |
| Nueva página | «nueva página», «página nueva», «empezar de nuevo», «nuevo proyecto» |
| Descargar | «descargar», «descarga la página», «bájala» |

«Deshacer el cambio del título y ponerlo verde» no es un comando: es una orden de edición.

## 7. Proyectos guardados

- **Guardado automático.** La primera página crea el proyecto, con el `<title>` como nombre; cada versión se guarda sola. El estado se ve junto al título: «Guardado», «Guardando…» o «Sin guardar» con «Reintentar guardar».
- **`/proyectos`:** la lista con el número de versiones, la última orden y la fecha. Ahí se abre cada uno (`/app?proyecto=id`, con todas sus versiones) y se renombra o se borra en línea, con confirmación.

## 8. Descargar y copiar

- **Descargar** baja `nombre-del-proyecto.html`: la página saneada, sin nada de la vista previa.
- **Copiar código** la copia al portapapeles.

## 9. Errores claros y amables

| Situación | Qué se ve |
|---|---|
| Permiso de micrófono denegado | «No tengo permiso para usar el micrófono. Actívalo en el navegador o escribe la orden.» |
| Sin micrófono | «No encuentro un micrófono. Conecta uno o escribe la orden.» |
| No se oyó nada | «No te escuché. Pulsa el micrófono e inténtalo de nuevo, o escribe la orden.» |
| Sin conexión o backend apagado | «No hay conexión con el servidor…», con **Reintentar** |
| Cuota de Gemini (429) | «Se agotó la cuota de la IA por ahora. Espera un minuto…» |
| Respuesta inválida dos veces (502) | «La IA devolvió una página inválida dos veces…», con **Reintentar** |
| Sesión expirada (401) | Vuelve a `/login` con «Tu sesión expiró» |

Lo escrito en «Tu orden» nunca se pierde por un error.
