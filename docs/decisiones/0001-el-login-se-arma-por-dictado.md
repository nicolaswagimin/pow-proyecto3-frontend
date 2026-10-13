# 0001 · El login se arma por dictado

- **Estado:** aceptada
- **Fecha:** 2026-10-12

## Contexto
El diseño anterior (atardecer, dunas, estallido) no tenía relación con la voz. El acceso es la única pantalla que se ve sin cuenta y la que el profesor ve primero.

## Decisión
El acceso es "del guion a la maqueta": un guion se dicta solo, frase por frase, y cada frase confirmada convierte un bloque de maqueta en el componente real. Al pasar a registro, el guion dicta "Agrega un campo para el nombre" y ese bloque se ensambla. Además, se puede dictar el correo de verdad.

## Consecuencias
- Se entiende qué hace el producto sin leer nada.
- La demostración no puede frenar a nadie: los campos funcionan bajo el bloque gris, enfocar un campo termina el dictado y hay botones para saltarlo y repetirlo.
- Con movimiento reducido o la pestaña oculta, el guion aparece completo.
- El ritmo (110 ms por palabra) es más rápido que el habla real (unos 400 ms): la demostración dura unos 5 segundos y no aburre.
