import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    base: '/',

    server: {
        port: 5173,
        open: true
    },

    publicDir: 'public',

    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                about: resolve(__dirname, 'about.html'),
                'artworks-and-videos': resolve(__dirname, 'artworks-and-videos.html'),
                'blogs-and-sponsor': resolve(__dirname, 'blogs-and-sponsor.html'),
                chatting: resolve(__dirname, 'chatting.html'),
                softwares: resolve(__dirname, 'softwares.html'),
                '404': resolve(__dirname, '404.html')
            }
        }
    }
});
