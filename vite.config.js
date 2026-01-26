import { defineConfig } from "vite";
import legacy from "@vitejs/plugin-legacy";
import react from "@vitejs/plugin-react";

export default defineConfig(async () => {
  const enableHttps = process.env.VITE_DEV_HTTPS === "1";
  const plugins = [
    react(),
    legacy({
      targets: ["defaults", "iOS >= 12", "Android >= 7"],
    }),
  ];
  let httpsEnabled = false;

  if (enableHttps) {
    try {
      const basicSsl = (await import("@vitejs/plugin-basic-ssl")).default;
      plugins.push(basicSsl());
      httpsEnabled = true;
    } catch (error) {
      // Fall back to HTTP if the SSL plugin is not installed yet.
      console.warn("[vite] HTTPS requested but @vitejs/plugin-basic-ssl is missing.");
    }
  }

  return {
    plugins,
    server: {
      host: true,
      port: 5173,
      https: httpsEnabled,
    },
    preview: {
      host: true,
      port: 4173,
      https: httpsEnabled,
    },
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
    },
  };
});
