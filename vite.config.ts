import { defineConfig } from 'vite';
import { resolve } from 'path';
import postcss from '@vituum/vite-plugin-postcss';
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons';
import glsl from 'vite-plugin-glsl';
import type { Plugin } from 'vite';

function logToTerminal(): Plugin {
  return {
    name: 'log-to-terminal',
    configureServer(server) {
      server.middlewares.use('/log', (req, res) => {
        let body = '';
        req.on('data', chunk => (body += chunk));
        req.on('end', () => {
          try {
            const msg = JSON.parse(body);
            console.log('[📝 Log:]', msg);
          } catch (err) {
            console.error('[Log] Failed to parse JSON:', body);
          }
          res.statusCode = 200;
          res.end('OK');
        });
      });
    }
  };
}
export default defineConfig({
    plugins: [
        postcss(),
        createSvgIconsPlugin({
            iconDirs: [`${resolve(__dirname, 'src/reall3d/assets/icons')}`],
            symbolId: 'svgicon-[name]',
        }),
        glsl({ include: ['**/*.glsl'] }),
        logToTerminal(),
    ],
    server: {
        port: 3100,
        open: true,
    },
    preview: {
        port: 4100,
    },
    base: './',
    publicDir: 'public',

    esbuild: {
    },

    build: {
        chunkSizeWarningLimit: 2048,
        sourcemap: false,
        rollupOptions: {
            output: {
                chunkFileNames: 'assets/chunk-[hash].js',
                entryFileNames: 'assets/entry-[hash].js',
                assetFileNames: 'assets/asset-[hash].[ext]',
            },
        },
    },
});
