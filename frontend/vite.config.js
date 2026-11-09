import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // NOTE: the previous manual groups (react-vendor + http-vendor) produced a production bundle
    // that crashed on load ("__exportAll is not a function": a circular import between the axios
    // chunk and the shared runtime helpers). Only the React group is kept; axios stays in the
    // main chunk. Route-level lazy imports already split the app per page.
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "react-vendor", test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/, priority: 20 },
          ],
        },
        // Drop console.log and debugger calls in production builds
        minify: {
          compress: { dropConsole: true, dropDebugger: true },
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
