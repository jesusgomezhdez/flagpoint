# Extensión de Chrome para capturas de pantalla con anotaciones (enfocada a equipos de desarrollo/QA)

## Contexto
Quiero construir una extensión de Chrome (Manifest V3) que capture la pestaña visible y abra un editor donde pueda anotar la captura (dibujar con marcador, agregar flechas, formas, texto y post-its) para señalar algo de un flujo de pruebas. La visión a futuro es conectarla con herramientas para desarrolladores (Jira, GitHub Issues, Slack, etc.), así que la arquitectura debe dejar ese camino abierto sin implementarlo todavía.

## Alcance de esta primera versión (MVP)
**Incluye:**
1. Clic en el ícono de la extensión → captura de la pestaña visible (`chrome.tabs.captureVisibleTab`).
2. Se abre una pestaña propia de la extensión (el editor) con la captura cargada.
3. Editor de anotaciones sobre la captura con estas herramientas:
   - Selección/mover/redimensionar/rotar/eliminar objetos
   - Marcador/lápiz libre (color y grosor configurables)
   - Flecha
   - Rectángulo y círculo/elipse (solo contorno)
   - Texto editable en el canvas
   - **Post-it**: rectángulo de color (amarillo por defecto) con texto editable, agrupado como un solo objeto
   - Deshacer/rehacer
   - Selector de color y de grosor
4. Salida: **Descargar PNG** y **Copiar al portapapeles** (`navigator.clipboard.write` con `ClipboardItem` `image/png`). La exportación debe incluir la imagen y las anotaciones, a resolución real (considerar `devicePixelRatio`).

**NO incluye (por ahora):**
- Guardar historial, almacenamiento persistente, IndexedDB ni cuentas de usuario
- Selección de área, captura de página completa o de otra ventana
- Integraciones con herramientas externas ni backend
- Contexto técnico (consola, red), solo dejar el espacio en la arquitectura

## Stack
- **TypeScript** (modo estricto)
- **WXT** como framework de extensiones (genera el manifest, HMR, estructura por entrypoints)
- **React** para la UI del editor
- **Fabric.js v6** para el canvas de anotaciones
- **Tailwind CSS** para estilos de la barra de herramientas
- Gestor de paquetes: pnpm (o el que prefiera el proyecto si ya hay uno)

## Permisos (mínimos)
- `activeTab`
- `clipboardWrite` solo si es realmente necesario
- `storage` únicamente para el traspaso temporal de la captura (ver más abajo)
- No pedir `<all_urls>`, `debugger` ni otros permisos amplios en esta versión

## Flujo técnico
1. El **background (service worker)** escucha `action.onClicked`, llama a `captureVisibleTab` y obtiene el data URL.
2. Para pasarlo al editor sin persistir nada: guardarlo en `chrome.storage.session` (memoria, se borra al cerrar el navegador) con una clave única, abrir la pestaña del editor con esa clave en la URL, y que el editor lo lea y **lo elimine inmediatamente** tras cargarlo.
3. El **editor** (página de la extensión) carga la imagen como fondo del canvas de Fabric, a su tamaño real, y permite anotar.
4. Manejar el caso de páginas donde no se puede capturar (`chrome://`, Chrome Web Store, etc.) mostrando un mensaje claro al usuario en vez de fallar en silencio.

## Arquitectura pensada para escalar
Quiero que el código esté organizado con puntos de extensión claros, aunque en el MVP solo exista una implementación de cada uno:

- **Capture strategies**: interfaz `CaptureStrategy` (`capture(tabId): Promise<CaptureResult>`). Hoy solo `VisibleTabStrategy`; mañana `AreaStrategy` y `FullPageStrategy`.
- **Annotation tools**: interfaz `Tool` (activar, desactivar, manejo de eventos del canvas) con un registro de herramientas. Cada herramienta (lápiz, flecha, forma, texto, post-it) es su propio módulo; agregar una nueva no debe tocar el núcleo del editor.
- **Exporters / destinos**: interfaz `Exporter { id; label; icon; export(image: Blob, context: CaptureContext): Promise<void> }` con un registro. Hoy: `DownloadExporter` y `ClipboardExporter`. A futuro: Jira, GitHub, Slack, etc. La barra de acciones del editor se genera a partir de ese registro.
- **CaptureContext**: tipo con metadatos de la captura (`url`, `title`, `timestamp`, `viewport`, `devicePixelRatio`, `userAgent`). Se llena con lo básico ahora y quedará listo para sumar errores de consola y requests fallidos más adelante.
- Separar la lógica del editor (estado, herramientas, exportación) de los componentes React, para poder probarla y reutilizarla.

## Estructura de carpetas sugerida
```
src/
├── entrypoints/
│   ├── background.ts
│   └── editor/          (página del editor: index.html, main.tsx)
├── core/
│   ├── capture/         (CaptureStrategy + VisibleTabStrategy)
│   ├── tools/           (Tool + una carpeta/archivo por herramienta)
│   ├── exporters/       (Exporter + download + clipboard)
│   └── types.ts         (CaptureContext, CaptureResult, etc.)
├── components/          (Toolbar, ColorPicker, ActionBar, etc.)
└── hooks/
```

## UX del editor
- Barra de herramientas clara (íconos con tooltip) y atajos de teclado básicos (`Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z`, `Delete`, `Ctrl/Cmd+C` para copiar la imagen final si no hay objeto seleccionado en edición).
- El canvas debe ajustarse visualmente a la ventana (zoom de vista) sin alterar la resolución real de exportación.
- Feedback visible al copiar o descargar (toast simple).

## Reglas de trabajo
- Genera el scaffold del proyecto y el código del MVP descrito, sin agregar funcionalidades fuera del alcance.
- **No ejecutes comandos que no te pida explícitamente**: no levantes servidores de desarrollo, no corras el linter ni instales librerías de linter por errores, y no hagas builds por tu cuenta. Si necesitas que se ejecute algo, dime el comando y yo lo corro.
- **No crees tests unitarios ni E2E.**
- Si hay una decisión de diseño ambigua, elige la opción más simple que no cierre el camino a las integraciones futuras y menciónala al final.

## Entregable
El proyecto completo con el código fuente, un `README` breve con cómo instalarlo y cargarlo en `chrome://extensions` (modo desarrollador), y una nota final con las decisiones relevantes que tomaste.