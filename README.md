# Flagpoint

Extensión de Chrome (Manifest V3) para capturar la pestaña visible y anotarla
(marcador, flechas, formas, texto y post-its), o grabarla en video, al reportar
hallazgos de QA.

## Requisitos

- Node.js 20+
- pnpm

## Instalación y desarrollo

```bash
pnpm install        # instala dependencias y genera los tipos de WXT (.wxt/)
pnpm dev            # abre Chrome con la extensión cargada y HMR
```

## Cargar en Chrome manualmente

```bash
pnpm build          # genera .output/chrome-mv3
```

1. Abre `chrome://extensions`.
2. Activa **Modo desarrollador** (arriba a la derecha).
3. Haz clic en **Cargar descomprimida** y elige la carpeta `.output/chrome-mv3`.
4. Fija la extensión en la barra y haz clic en su ícono sobre cualquier página web.

## Uso

Al hacer clic en el ícono se abre un menú con dos opciones:

- **Capturar pantalla**: captura la pestaña visible y abre el editor en una
  pestaña nueva.
- **Grabar video**: graba la pestaña (solo imagen, sin audio, máx. 5 min). En
  la pestaña aparece una píldora arrastrable con el tiempo y un botón ■ para
  detener; el ícono muestra `REC`. Se detiene con ese botón, con **Detener y ver
  video** en el popup, con `Alt+Shift+S` (configurable en
  `chrome://extensions/shortcuts`), al cerrar la pestaña o al llegar al límite.
  Al terminar se abre la vista previa para descargar el WebM.

  La píldora sale en el video. Se reinyecta tras cada carga completa dentro del
  mismo sitio; si la pestaña navega a otro dominio, Chrome retira `activeTab` y
  la píldora ya no aparece (la grabación continúa).

| Atajo | Acción |
|---|---|
| `V` `P` `A` `R` `O` `T` `N` | Seleccionar, marcador, flecha, rectángulo, elipse, texto, post-it |
| `Ctrl/⌘ + Z` | Deshacer |
| `Ctrl/⌘ + Shift + Z` (o `Ctrl + Y`) | Rehacer |
| `Supr` / `Backspace` | Eliminar la selección |
| `Ctrl/⌘ + C` | Copiar la imagen final (si no estás editando un texto) |
| `Esc` | Terminar la edición de texto / quitar la selección |

Doble clic sobre un texto o post-it para editarlo. Si cambias el color o el
grosor con un objeto seleccionado, se aplica a ese objeto.

## Estructura

```
src/
├── entrypoints/
│   ├── background.ts        # recibe las órdenes del popup: captura, inicia/detiene grabación
│   ├── popup/               # menú del ícono: captura o video (React)
│   ├── editor/              # página del editor (React)
│   ├── offscreen/           # documento oculto con MediaRecorder (grabación)
│   ├── recording-indicator.ts # píldora inyectada en la pestaña grabada (Shadow DOM)
│   └── recording/           # vista previa y descarga del video (React)
├── core/                    # lógica sin React
│   ├── capture/             # CaptureStrategy + VisibleTabStrategy + traspaso vía storage.session
│   ├── editor/              # EditorController, historial, estilos
│   ├── tools/               # Tool + registro + una carpeta por herramienta
│   ├── exporters/           # Exporter + registro + descarga y portapapeles
│   ├── recording/           # límites, estado en storage.session y traspaso del video vía IndexedDB
│   ├── messages.ts          # mensajes entre popup, background y offscreen
│   └── types.ts             # CaptureContext, CaptureResult
├── components/              # icon-toolbar, style-bar, color-picker, action-bar, page-chip, toast…
├── hooks/                   # use-editor, use-editor-shortcuts, use-capture-handoff, use-recording-handoff, use-toast
└── styles/app.css           # estilos compartidos por todas las páginas
```

### Puntos de extensión

- **Nueva herramienta**: implementa `Tool` (`src/core/tools/tool.ts`) en su
  carpeta y regístrala en `createDefaultToolRegistry()`. La barra se genera
  desde el registro.
- **Nuevo destino** (Jira, GitHub, Slack…): implementa `Exporter` y regístralo
  en `createDefaultExporterRegistry()`. La barra de acciones se genera desde el
  registro y recibe el PNG + `CaptureContext`.
- **Nueva forma de captura**: implementa `CaptureStrategy` y agrégala a
  `captureStrategies`.

## Créditos

Los textos y post-its usan **Excalifont** (© Excalidraw), distribuida bajo la
licencia [SIL Open Font License 1.1](https://openfontlicense.org). Se descargó
de <https://plus.excalidraw.com/excalifont> y se incluye en
`src/assets/fonts/excalifont-regular.woff2`; el texto de la licencia viene
embebido en el propio archivo de la fuente.

## Permisos

`activeTab`, `storage` (únicamente `storage.session`, que vive en memoria),
`tabCapture` (grabar la pestaña), `offscreen` (documento oculto donde corre
`MediaRecorder`, que el service worker no puede usar) y `scripting` (inyectar
el indicador de grabación con el acceso de `activeTab`). No se piden permisos de
host.
