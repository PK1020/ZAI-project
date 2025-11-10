import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        // Ustawienie proxy do komunikacji z backendem (Node.js)
        // To zastępuje pole "proxy" w package.json z create-react-app
        proxy: {
            // Jeśli żądanie zaczyna się od /api...
            '/api': {
                target: 'http://localhost:3001', // Przekieruj je do serwera backendu
                changeOrigin: true, // Wymagane dla vhostów
            },
            // Tak samo dla ścieżek autentykacji
            '/auth': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            }
        }
    }
});