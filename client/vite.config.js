import { defineConfig, loadEnv, transformWithEsbuild } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

function handleModuleDirectivesPlugin() {
  return {
    name: 'handle-module-directives-plugin',
    transform(code, id) {
      if (id.includes('@vkontakte/icons')) {
        code = code.replace(/"use-client";?/g, '')
      }
      return { code }
    },
  }
}

function threatJsFilesAsJsx() {
  return {
    name: 'treat-js-files-as-jsx',
    async transform(code, id) {
      if (!id.match(/src\/.*\.js$/)) return null

      return transformWithEsbuild(code, id, {
        loader: 'jsx',
        jsx: 'automatic',
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process?.cwd ? process.cwd() : './', '')

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
      port: env.CLIENT_OUTSIDE_PORT
        ? Number(env.CLIENT_OUTSIDE_PORT)
        : 3020,
      host: '0.0.0.0',
      hmr: {
        protocol: env.VITE_HMR_PORT === '443' ? 'wss' : 'ws',
        host:
          env.VITE_HMR_PORT === '443' ? 'govorix.ru' : 'localhost',
        port: env.VITE_HMR_PORT ? Number(env.VITE_HMR_PORT) : 3020,
      },
    },

    // === НАСТРОЙКА ОПТИМИЗАЦИИ И СБОРКИ В ЧАНКИ ===
    build: {
      outDir: 'dist',
      chunkSizeWarningLimit: 800, // Поднимаем порог предупреждения до 800 КБ
      rollupOptions: {
        output: {
          // Функция автоматического распределения тяжелого кода по файлам
          manualChunks(id) {
            // 1. Выносим все сторонние npm-пакеты (react, redux, axios) в отдельный vendor-файл
            if (id.includes('node_modules')) {
              return 'vendor'
            }
            // 2. Если в проекте есть тяжелые иконки VK, выносим их в отдельный чанк vk-icons
            if (id.includes('@vkontakte/icons')) {
              return 'vk-icons'
            }
          },
        },
      },
    },
  }
})
