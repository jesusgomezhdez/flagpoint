# Ficha de Chrome Web Store — Flagpoint 1.1.0

Textos listos para copiar en el Developer Dashboard. Cada sección indica la
pestaña y el campo donde va.

---

## Pestaña "Store listing" (ficha de la tienda)

### Nombre
Viene del manifest: **Flagpoint**

### Descripción corta (resumen)
Viene del manifest (`wxt.config.ts`, 120 de 132 caracteres):

> Captura o graba en video la pestaña y anota las capturas con flechas, formas, texto y post-its para reportar bugs de QA.

### Descripción detallada

```text
Flagpoint convierte cualquier pantalla en un reporte claro en segundos.

Haz clic en el ícono de la extensión y elige "Capturar pantalla": Flagpoint captura la pestaña que estás viendo y la abre en un editor donde puedes señalar exactamente qué está mal: un botón desalineado, un texto incorrecto, un error en un flujo de pruebas. Después copia la imagen y pégala directo en tu ticket, chat o documento.

¿El bug solo se entiende en movimiento? Elige "Grabar video", reproduce el problema y detén la grabación: verás la vista previa y podrás descargar el video para adjuntarlo a tu reporte.

Pensada para equipos de QA, desarrollo, producto y diseño que reportan hallazgos todos los días.

HERRAMIENTAS DE ANOTACIÓN
• Marcador libre para resaltar o encerrar zonas
• Flechas para apuntar al detalle exacto
• Rectángulos y elipses para enmarcar elementos
• Texto editable con estilo manuscrito
• Post-its para dejar notas y contexto
• Mover, redimensionar, rotar y eliminar cualquier anotación
• Colores, grosores y tamaños de texto (S, M, L, XL)
• Deshacer y rehacer ilimitado durante la sesión

EXPORTA EN UN CLIC
• Copiar al portapapeles para pegar en Jira, GitHub, Slack, Notion, correo, etc.
• Descargar como PNG
• La imagen se exporta a la resolución real de tu pantalla, nítida incluso en pantallas Retina

GRABACIÓN DE VIDEO
• Graba la pestaña activa hasta 5 minutos (solo imagen, sin audio)
• Indicador discreto en la propia pestaña con el tiempo y un botón para detener (se puede arrastrar)
• Indicador "REC" en el ícono y atajo de teclado (Alt+Shift+S) para detener
• Vista previa al terminar y descarga en formato WebM

ATAJOS DE TECLADO
• V, P, A, R, O, T, N: cambiar de herramienta
• Ctrl/⌘ + Z y Ctrl/⌘ + Shift + Z: deshacer y rehacer
• Ctrl/⌘ + C: copiar la imagen final
• Supr: eliminar la selección

PRIVACIDAD PRIMERO
• Todo ocurre en tu navegador: las capturas y los videos no se envían a ningún servidor
• No guarda historial ni requiere cuenta
• No graba audio ni usa micrófono o cámara
• Solo accede a la pestaña cuando tú eliges capturar o grabar

Nota: por restricciones de Chrome, no es posible capturar ni grabar páginas internas del navegador (chrome://), la Chrome Web Store ni otras extensiones.
```

### Categoría
**Herramientas para desarrolladores** (Developer Tools)

### Idioma
**Español**

### Recursos gráficos
| Recurso | Tamaño | Estado |
|---|---|---|
| Ícono de la tienda | 128×128 PNG | Usar `public/icon/128.png` |
| Capturas de pantalla | 1280×800 o 640×400, de 1 a 5 | Pendiente |
| Imagen promocional pequeña | 440×280 | Pendiente (obligatoria) |
| Imagen promocional grande | 1400×560 | Opcional |

Ideas para las capturas:
1. Una página real con flecha, rectángulo y post-it explicando un bug.
2. El editor mostrando la barra de herramientas y el panel de estilo.
3. El toast "Imagen copiada al portapapeles" y la imagen pegada en un ticket.

---

## Pestaña "Prácticas de privacidad" / "Privacy practices"

### Propósito único (Single purpose)

```text
Documentar hallazgos visuales de una pestaña del navegador para reportes de QA: capturar la pestaña visible y abrirla en un editor local para anotarla y exportarla (portapapeles o PNG), o grabarla en video para revisarla y descargarla (WebM).
```

### Justificación de permisos

**activeTab**
```text
Se usa para capturar la pestaña visible (chrome.tabs.captureVisibleTab) únicamente cuando el usuario abre el popup de la extensión y elige "Capturar pantalla". El acceso se limita a esa pestaña y a ese momento; la extensión no lee ni modifica el contenido de las páginas.
```

**storage**
```text
Se usa exclusivamente chrome.storage.session (en memoria) para pasar la captura recién tomada del service worker a la página del editor de la extensión, que la elimina en cuanto la lee, y para recordar si hay una grabación en curso (id de la pestaña y hora de inicio). No se guarda nada de forma persistente.
```

**tabCapture**
```text
Se usa chrome.tabCapture.getMediaStreamId para grabar en video (sin audio) la pestaña activa únicamente cuando el usuario abre el popup y elige "Grabar video". La grabación dura hasta que el usuario la detiene, cierra la pestaña o se alcanzan 5 minutos; el ícono muestra "REC" mientras tanto. El video se procesa solo en el dispositivo y el usuario decide si lo descarga.
```

**scripting**
```text
Se usa chrome.scripting.executeScript, con el acceso temporal que otorga activeTab, para mostrar en la pestaña que se está grabando un pequeño indicador con el tiempo transcurrido y un botón para detener la grabación. Se reinyecta si la página se recarga y se retira al terminar. El indicador vive en un Shadow DOM aislado y no lee ni modifica el contenido de la página. No se piden permisos de host.
```

**offscreen**
```text
Los service workers de Manifest V3 no pueden usar getUserMedia ni MediaRecorder. Se crea un documento offscreen (motivo USER_MEDIA) solo mientras dura la grabación para convertir el stream de la pestaña en un video WebM, y se cierra al terminar.
```

### Código remoto
**No, no uso código remoto.** Todo el código y la fuente tipográfica van incluidos en el paquete.

### Uso de datos
Marcar que **no** se recopila ninguno de los tipos de datos de la lista
(información de identificación personal, salud, financiera, autenticación,
comunicaciones personales, ubicación, historial web, actividad del usuario,
contenido del sitio web).

Las capturas y los videos contienen contenido de la página, pero se procesan solo en el
dispositivo del usuario y nunca salen de él, por lo que no cuentan como datos
"recopilados" (no se transmiten al desarrollador ni a terceros).

Marcar las tres certificaciones:
- No vendo ni transfiero datos de usuarios a terceros, fuera de los casos de uso aprobados.
- No uso ni transfiero datos de usuarios para fines no relacionados con la funcionalidad principal del elemento.
- No uso ni transfiero datos de usuarios para determinar la solvencia crediticia o para otorgar préstamos.

### URL de la política de privacidad
https://jesusgomez.notion.site/Pol-ticas-de-privacidad-de-Flagpoint-401f264c7ac48020a565f8c4f2d7b10f

(Copia publicada de `docs/privacy-policy.md`; si cambias una, actualiza la otra.)

---

## Pestaña "Distribución" / "Distribution"

- **Precio:** Gratis
- **Visibilidad:** Pública (o "No listada" para una primera prueba con tu equipo)
- **Regiones:** Todas

---

## Instrucciones para el revisor (opcional)

```text
No requiere cuenta ni configuración. Para probar:
1. Abre cualquier sitio web (por ejemplo https://example.com).
2. Haz clic en el ícono de Flagpoint en la barra de herramientas y elige "Capturar pantalla".
3. Se abre una pestaña con el editor y la captura cargada.
4. Usa la barra superior para dibujar, agregar flechas, texto o post-its.
5. Pulsa "Copiar al portapapeles" o "Descargar PNG" para exportar.
Para probar el video:
6. Vuelve al sitio, abre el ícono de Flagpoint y elige "Grabar video" (el ícono muestra "REC").
7. Navega o haz scroll unos segundos y pulsa el botón ■ del indicador en la esquina de la página (o abre el ícono y pulsa "Detener y ver video", o usa Alt+Shift+S).
8. Se abre la vista previa; pulsa "Descargar video" para guardar el archivo WebM.
Las páginas internas de Chrome (chrome://) no se pueden capturar; en ese caso la extensión muestra un mensaje explicativo.
```
