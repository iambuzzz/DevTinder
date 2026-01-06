import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});

//for using ngrok

// export default defineConfig({
//   plugins: [react(), tailwindcss()],
//   server: {
//     host: true, // Ye line add karo taaki local network pe accessible ho
//     proxy: {
//       "/api": {
//         target: "http://localhost:3000", // Backend port check kar lena (3000 hi hai na?)
//         changeOrigin: true,
//         secure: false,
//         // Agar backend me routes '/login' hain na ki '/api/login', toh ye line dalo:
//         rewrite: (path) => path.replace(/^\/api/, ""),
//       },
//     },
//   },
// });
