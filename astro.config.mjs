import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite'; // Importamos el plugin moderno de Vite
import vercel from '@astrojs/vercel';

export default defineConfig({
  // Quitamos 'tailwind()' de las integraciones para evitar el error de PostCSS
  integrations: [react()],
  
  // Agregamos Tailwind de forma nativa en la sección de Vite
  vite: {
    plugins: [tailwindcss()],
  },
  
  // Mantenemos la conexión en vivo con el servidor de Vercel
  output: 'server', 
  adapter: vercel()
});