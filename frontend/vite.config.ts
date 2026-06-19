import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../shared"),
      zod: path.resolve(__dirname, "./node_modules/zod"),
      // Compat shims — menggantikan Next.js imports
      "next/link": path.resolve(__dirname, "./src/compat/link.tsx"),
      "next/image": path.resolve(__dirname, "./src/compat/image.tsx"),
      "next/navigation": path.resolve(__dirname, "./src/compat/navigation.ts"),
      "next-auth/react": path.resolve(__dirname, "./src/compat/auth.ts"),
      "@prisma/client": path.resolve(__dirname, "./src/compat/prisma.ts"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Dev: same-origin agar cookie session sederhana (tanpa CORS)
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: false,
      },
    },
  },
});
