# 0007 · Las versiones forman un árbol: deshacer nunca borra

- **Estado:** aceptada · **Fecha:** 2026-10-19

## Contexto
Cada orden cambia la página y se puede volver atrás. Con una pila clásica de deshacer y rehacer, editar después de deshacer borra las versiones «de adelante». En una herramienta de prototipado eso es perder trabajo: alguien vuelve a la versión 1 para probar otra idea y pierde la 2 y la 3.

## Decisión
- Cada versión guarda su **`base_id`**, la versión de la que salió. En la base es una columna, y en el frontend, un campo.
- **Deshacer** va a la base de la actual; **rehacer**, a la versión más reciente que salió de la actual.
- **Volver a una versión** solo cambia cuál se ve. Una orden nueva crea una versión desde la que se ve, al final de la lista.
- La línea de tiempo muestra todas, en orden de creación, y avisa cuando una salió de otra que no es la anterior («desde la 1»).
- Las funciones son puras y están probadas aparte (`estudio/versiones.ts`).

## Consecuencias
- Ninguna versión se pierde: todas siguen en el servidor y en la línea de tiempo.
- Rehacer después de ramificar sigue la última rama, que es lo que se espera la mayoría de las veces. Las otras ramas quedan a un clic en la línea de tiempo.
- El guardado tiene que respetar el orden: una versión sin guardar puede ser la base de otra, y los ids temporales se reemplazan también en los `base_id`.
