import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
function normalizeBase(input) {
    var value = input === null || input === void 0 ? void 0 : input.trim();
    if (!value || value === '/')
        return '/';
    return "/".concat(value.replace(/^\/+|\/+$/g, ''), "/");
}
export default defineConfig(function (_a) {
    var command = _a.command;
    return ({
        // Standalone Cloudflare Pages deploys should build for domain root.
        // Legacy unified nginx deploys can override this with VITE_APP_BASE=/crm/.
        base: command === 'build' ? normalizeBase(process.env.VITE_APP_BASE) : '/',
        plugins: [react()],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url))
            }
        },
        server: { port: 5174 }
    });
});
