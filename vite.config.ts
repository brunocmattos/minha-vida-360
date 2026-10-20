import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    tanstackStart({
      // src/server.ts envolve o servidor com a página de erro amigável.
      server: { entry: "server" },
      // Impede que código de servidor (chaves, banco) vá parar no bundle do navegador.
      importProtection: {
        behavior: "error",
        client: { files: ["**/server/**"], specifiers: ["server-only"] },
      },
    }),
    // Build para a Vercel; NITRO_PRESET=node-server (por ex.) troca o destino.
    ...(command === "build"
      ? [
          nitro({
            preset: process.env["NITRO_PRESET"] || "vercel",
            routeRules: {
              "/**": {
                headers: {
                  "X-Content-Type-Options": "nosniff",
                  "X-Frame-Options": "DENY",
                  "Referrer-Policy": "strict-origin-when-cross-origin",
                  "Permissions-Policy": "camera=(), geolocation=(), microphone=(self)", // voz da Luísa
                  "X-Robots-Tag": "noindex, nofollow", // app pessoal: fora do Google
                },
              },
            },
          }),
        ]
      : []),
    viteReact(),
  ],
  resolve: {
    tsconfigPaths: true, // atalho "@/..." do tsconfig.json
    // Uma cópia só de React/react-query no bundle (duas cópias quebram hooks).
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  server: { host: "::", port: 8080 },
}));
