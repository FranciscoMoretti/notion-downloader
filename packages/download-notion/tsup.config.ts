import { defineConfig } from "tsup"

export default defineConfig({
  clean: true,
  dts: true,
  entry: ["src/index.ts"],
  format: ["esm"],
  sourcemap: true,
  keepNames: true,
  // minify: true, # Disable for meaningful names when debugging
  target: "esnext",
  outDir: "dist",
})
