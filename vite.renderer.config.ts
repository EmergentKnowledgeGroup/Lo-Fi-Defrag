import { defineConfig } from 'vite';

// Electron Forge bundles this config through CommonJS first, so the ESM-only
// React plugin has to stay behind a dynamic import.
export default defineConfig(async () => {
  const { default: react } = await import('@vitejs/plugin-react');
  return {
    plugins: [react()],
  };
});
