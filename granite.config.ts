import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "toss-stock-grow",
  brand: {
    displayName: "주식 키우기",
    primaryColor: "#3333dd",
    icon: "",
  },
  web: {
    host: "localhost",
    port: 5173,
    commands: {
      dev: "vite dev",
      build: "vite build",
    },
  },
  permissions: [],
  outdir: "dist",
});
