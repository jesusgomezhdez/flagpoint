# Política de privacidad de Flagpoint

**Última actualización:** 23 de octubre de 2026

Flagpoint es una extensión de Chrome que captura la pestaña visible del
navegador para que puedas anotarla y exportarla, o la graba en video para que
puedas descargarla. Esta política explica qué
información maneja la extensión y cómo.

## Resumen

Flagpoint **no recopila, no almacena de forma persistente y no transmite**
ningún dato personal ni ningún contenido de las páginas que visitas. Todo el
procesamiento ocurre localmente en tu navegador.

## Qué información maneja la extensión

- **Capturas de pantalla.** Cuando haces clic en el ícono de Flagpoint, la
  extensión toma una imagen del área visible de la pestaña activa. Esa imagen
  puede incluir cualquier información que aparezca en pantalla.
- **Grabaciones de video.** Cuando eliges "Grabar video" en el menú de
  Flagpoint, la extensión graba la pestaña activa (solo imagen, sin audio)
  hasta que la detienes, la cierras o se alcanza el límite de 5 minutos. El
  video puede incluir cualquier información que aparezca en esa pestaña.
- **Metadatos de la pestaña.** Junto con la captura se leen la URL y el título
  de la página, la fecha y hora, y el tamaño de la ventana. Se usan solo para
  mostrar la página de origen en el editor o en la vista previa del video y
  para nombrar el archivo descargado.

## Cómo se usa y dónde se guarda

- La captura se guarda temporalmente en la memoria de sesión de Chrome
  (`chrome.storage.session`) únicamente para pasarla al editor, y se elimina
  en cuanto el editor la carga.
- Las anotaciones y la imagen solo existen mientras la pestaña del editor está
  abierta. Al cerrarla, se descartan.
- La imagen solo sale del editor cuando tú lo decides: al copiarla a tu
  portapapeles o al descargarla como archivo PNG en tu dispositivo.
- El video se graba en un documento oculto de la propia extensión y se guarda
  temporalmente en el almacenamiento local del navegador (IndexedDB)
  únicamente para pasarlo a la página de vista previa, que lo elimina en
  cuanto lo carga. Al iniciar una nueva grabación se borra cualquier resto de
  grabaciones anteriores.
- El video solo sale de la vista previa cuando tú lo descargas como archivo
  WebM en tu dispositivo. Al cerrar la vista previa, se descarta.

## Qué no hace la extensión

- No envía capturas, URLs ni ningún otro dato a servidores del desarrollador
  ni de terceros.
- No usa analítica, cookies de seguimiento ni publicidad.
- No requiere cuenta ni inicio de sesión.
- No graba audio ni accede al micrófono o a la cámara.
- No lee ni modifica el contenido de las páginas que visitas; solo captura la
  imagen visible o graba la pestaña cuando tú lo pides.
- No vende ni comparte datos con terceros.

## Permisos

- **activeTab:** permite capturar la pestaña activa solo cuando abres el menú
  de la extensión y eliges una acción.
- **storage:** permite usar la memoria de sesión para pasar la captura al
  editor y para recordar si hay una grabación en curso, como se describe arriba.
- **tabCapture:** permite grabar en video la pestaña activa cuando eliges
  "Grabar video".
- **scripting:** permite mostrar en la pestaña que se está grabando un pequeño
  indicador con el tiempo y un botón para detener. El indicador no lee ni
  modifica el contenido de la página.
- **offscreen:** permite crear un documento oculto de la extensión donde se
  realiza la grabación, ya que el proceso en segundo plano de Chrome no puede
  grabar video por sí mismo.

## Cambios en esta política

Si una versión futura de Flagpoint cambia la forma en que se maneja la
información (por ejemplo, al agregar integraciones con otras herramientas),
esta política se actualizará antes de publicar esa versión y se indicará la
nueva fecha de actualización.

## Contacto

Si tienes preguntas sobre esta política, escribe a
**gomezhdez.jesus@gmail.com**.
