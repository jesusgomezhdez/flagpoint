import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/reference/wxt/interfaces/inlineconfig.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'Flagpoint',
    // Es también la descripción corta de Chrome Web Store (máx. 132 caracteres).
    description: 'Captura o graba en video la pestaña y anota las capturas con flechas, formas, texto y post-its para reportar bugs de QA.',
    // tabCapture + offscreen: grabar la pestaña en un documento oculto (el service worker no puede usar MediaRecorder).
    // scripting: inyectar el indicador de grabación en la pestaña grabada (con el acceso de activeTab).
    permissions: ['activeTab', 'storage', 'tabCapture', 'offscreen', 'scripting'],
    // El popup (entrypoints/popup) deja elegir entre captura y grabación.
    action: {
      default_title: 'Flagpoint',
    },
    commands: {
      'stop-recording': {
        suggested_key: { default: 'Alt+Shift+S' },
        description: 'Detener la grabación de video',
      },
    },
  },
});
