import { defineConfig } from 'vite';
// base './' so the build loads from file:// inside an Android WebView (Capacitor).
export default defineConfig({ base: './' });
