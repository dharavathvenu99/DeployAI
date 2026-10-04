import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  // Get API URL from environment variable
  // In development: uses Vite proxy to localhost:8001
  // In production: MUST be set via platform environment variables (Vercel/Netlify/Railway)
  const apiUrl = process.env.VITE_API_URL || 'http://127.0.0.1:8001';

  // In production, VITE_API_URL MUST be set via platform environment variables
  // We don't provide a fallback in production to avoid silent failures
  const viteApiUrl = isProduction 
    ? (process.env.VITE_API_URL || '') 
    : apiUrl;

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      port: 5173,
      host: true, // Listen on all network interfaces for iQOO phone local WiFi testing
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    define: {
      // Make VITE_API_URL available in client code
      // In production, this will be empty string if not set (handled by api.ts)
      'import.meta.env.VITE_API_URL': JSON.stringify(viteApiUrl),
    },
    build: {
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: (id: string) => {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) return 'vendor';
              if (id.includes('react-router')) return 'router';
              if (id.includes('lucide-react') || id.includes('clsx') || id.includes('tailwind-merge')) return 'ui';
              return 'vendor';
            }
          },
        },
      },
    },
  };
});