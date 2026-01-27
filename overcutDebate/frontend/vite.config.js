// frontend/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Si no usas Vite, este archivo puede existir sin molestar.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8085
  }
});
