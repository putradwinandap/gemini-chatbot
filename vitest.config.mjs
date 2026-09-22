import path from "node:path";
import { defineConfig } from "vitest/config";

const config = defineConfig({
  test: { environment: "jsdom" },
  resolve: { alias: { "@": path.resolve(".") } },
});

export default config;
