import { defineConfig, loadEnv, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';

function handleModuleDirectivesPlugin() {
  return {
    name: 'handle-module-directives-plugin',
    transform(code, id) {
      if (id.includes('@vkontakte/icons')) {
        code = code.replace(/"use-client";?/g, '');
      }
      return { code };
    },
  };
}

function threatJsFilesAsJsx() {
  return {
    name: 'treat-js-files-as-jsx',
    async transform(code, id) {
      if (!id.match(/src\/.*\.js$/)) return null;

      return transformWithEsbuild(code, id, {
        loader: 'jsx',
        jsx: 'automatic',
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Официальный способ Vite загрузить переменные из .env файлов
  // Проверяет корень проекта и системное окружение Docker
  const env = loadEnv(mode, process?.cwd ? process.cwd() : './', '');

  return {
    base: '/',

    plugins: [
      react(),
      threatJsFilesAsJsx(),
      handleModuleDirectivesPlugin(),
      legacy({
        targets: ['defaults', 'not IE 11'],
      }),
    ],

    optimizeDeps: {
      force: true,
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },

    server: {
      // Считываем порты через объект env, полностью избавляясь от ошибок "process is not defined"
      port: env.CLIENT_OUTSIDE_PORT ? Number(env.CLIENT_OUTSIDE_PORT) : 3020,
      host: '0.0.0.0', 
      hmr: {
        protocol: env.VITE_HMR_PORT === '443' ? 'wss' : 'ws',
        host: env.VITE_HMR_PORT === '443' ? 'govorix.ru' : 'localhost',
        port: env.VITE_HMR_PORT ? Number(env.VITE_HMR_PORT) : 3020,
      },
    },

    build: {
      outDir: 'dist',
    },
  };
});
