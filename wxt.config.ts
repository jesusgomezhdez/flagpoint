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
    description: 'Captura la pestaña visible y anótala para reportar hallazgos de QA.',
    permissions: ['activeTab', 'storage'],
    // Sin popup: el clic en el ícono dispara action.onClicked en el background.
    action: {
      default_title: 'Capturar pestaña con Flagpoint',
    },
  },
});
