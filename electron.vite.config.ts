import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { normalizePath } from 'vite';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src'),
        "@framework": resolve("src/renderer/WebSDK/Framework/src"),
        "@cubismsdksamples": resolve("src/renderer/WebSDK/src"),
        "@motionsyncframework": resolve(
          "src/renderer/MotionSync/Framework/src",
        ),
        "@motionsync": resolve("src/renderer/MotionSync/src"),
        "/src": resolve("src/renderer/src"),
      },
    },
    plugins: [
      viteStaticCopy({
        targets: [
          {
            src: normalizePath(resolve(__dirname, 'node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js')),
            dest: './libs/',
          },
          {
            src: normalizePath(resolve(__dirname, 'node_modules/@ricky0123/vad-web/dist/silero_vad_v5.onnx')),
            dest: './libs/',
          },
          {
            src: normalizePath(resolve(__dirname, 'node_modules/@ricky0123/vad-web/dist/silero_vad_legacy.onnx')),
            dest: './libs/',
          },
          {
            src: normalizePath(resolve(__dirname, 'node_modules/onnxruntime-web/dist/*.wasm')),
            dest: './libs/',
          },
          {
            src: normalizePath(resolve(__dirname, 'src/renderer/WebSDK/Core/live2dcubismcore.js')),
            dest: './libs/'
          }
        ],
      }),
      react(),
    ],
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          if (warning.message.includes('onnxruntime')) {
            return;
          }
          warn(warning);
        },
      },
    },
  },
});
