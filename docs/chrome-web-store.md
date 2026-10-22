# Ficha de Chrome Web Store — Flagpoint 1.0.0

Textos listos para copiar en el Developer Dashboard. Cada sección indica la
pestaña y el campo donde va.

---

## Pestaña "Store listing" (ficha de la tienda)

### Nombre
Viene del manifest: **Flagpoint**

### Descripción corta (resumen)
Viene del manifest (`wxt.config.ts`, 104 de 132 caracteres):

> Captura la pestaña y anótala con flechas, formas, texto y post-its para reportar bugs y hallazgos de QA.

### Descripción detallada

```text
Flagpoint convierte cualquier pantalla en un reporte claro en segundos.

Haz clic en el ícono de la extensión, Flagpoint captura la pestaña que estás viendo y la abre en un editor donde puedes señalar exactamente qué está mal: un botón desalineado, un texto incorrecto, un error en un flujo de pruebas. Después copia la imagen y pégala directo en tu ticket, chat o documento.

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

ATAJOS DE TECLADO
• V, P, A, R, O, T, N: cambiar de herramienta
• Ctrl/⌘ + Z y Ctrl/⌘ + Shift + Z: deshacer y rehacer
• Ctrl/⌘ + C: copiar la imagen final
• Supr: eliminar la selección

PRIVACIDAD PRIMERO
• Todo ocurre en tu navegador: las capturas no se envían a ningún servidor
• No guarda historial ni requiere cuenta
• Permisos mínimos: solo accede a la pestaña en el momento en que haces clic en el ícono

Nota: por restricciones de Chrome, no es posible capturar páginas internas del navegador (chrome://), la Chrome Web Store ni otras extensiones.
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
Capturar la pestaña visible del navegador y abrirla en un editor local para anotarla (dibujo libre, flechas, formas, texto y notas) y exportar la imagen resultante al portapapeles o como archivo PNG.
```

### Justificación de permisos

**activeTab**
```text
Se usa para capturar la pestaña visible (chrome.tabs.captureVisibleTab) únicamente cuando el usuario hace clic en el ícono de la extensión. El acceso se limita a esa pestaña y a ese momento; la extensión no lee ni modifica el contenido de las páginas.
```

**storage**
```text
Se usa exclusivamente chrome.storage.session (en memoria) para pasar la captura recién tomada del service worker a la página del editor de la extensión. El editor la elimina en cuanto la lee. No se guarda nada de forma persistente.
```

### Código remoto
**No, no uso código remoto.** Todo el código y la fuente tipográfica van incluidos en el paquete.

### Uso de datos
Marcar que **no** se recopila ninguno de los tipos de datos de la lista
(información de identificación personal, salud, financiera, autenticación,
comunicaciones personales, ubicación, historial web, actividad del usuario,
contenido del sitio web).

Las capturas contienen contenido de la página, pero se procesan solo en el
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
2. Haz clic en el ícono de Flagpoint en la barra de herramientas.
3. Se abre una pestaña con el editor y la captura cargada.
4. Usa la barra superior para dibujar, agregar flechas, texto o post-its.
5. Pulsa "Copiar al portapapeles" o "Descargar PNG" para exportar.
Las páginas internas de Chrome (chrome://) no se pueden capturar; en ese caso la extensión muestra un mensaje explicativo.
```
