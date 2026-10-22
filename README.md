# Flagpoint

Extensión de Chrome (Manifest V3) para capturar la pestaña visible y anotarla
(marcador, flechas, formas, texto y post-its) al reportar hallazgos de QA.

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

Al hacer clic en el ícono se captura la pestaña visible y se abre el editor en
una pestaña nueva.

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
│   ├── background.ts        # action.onClicked → captura → abre el editor
│   └── editor/              # página del editor (React)
├── core/                    # lógica sin React
│   ├── capture/             # CaptureStrategy + VisibleTabStrategy + traspaso vía storage.session
│   ├── editor/              # EditorController, historial, estilos
│   ├── tools/               # Tool + registro + una carpeta por herramienta
│   ├── exporters/           # Exporter + registro + descarga y portapapeles
│   └── types.ts             # CaptureContext, CaptureResult
├── components/              # icon-toolbar, style-bar, color-picker, action-bar, toast…
└── hooks/                   # use-editor, use-editor-shortcuts, use-capture-handoff, use-toast
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

Solo `activeTab` y `storage` (este último únicamente para `storage.session`,
que vive en memoria). No se piden permisos de host.
