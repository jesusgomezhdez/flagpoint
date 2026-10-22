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
    description: 'Captura la pestaña y anótala con flechas, formas, texto y post-its para reportar bugs y hallazgos de QA.',
    permissions: ['activeTab', 'storage'],
    // Sin popup: el clic en el ícono dispara action.onClicked en el background.
    action: {
      default_title: 'Capturar pestaña con Flagpoint',
    },
  },
});
