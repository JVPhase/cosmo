import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig(function (_a) {
    var command = _a.command;
    return ({
        // В Docker / едином nginx-контейнере CRM отдаётся с префикса /crm/
        base: command === 'build' ? '/crm/' : '/',
        plugins: [react()],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url))
            }
        },
        server: { port: 5174 }
    });
});
