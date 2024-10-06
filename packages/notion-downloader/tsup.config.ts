import { defineConfig } from "tsup"

export default defineConfig({
  dts: true,
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  sourcemap: true,
  keepNames: true,
  // minify: true, # Disable for meaningful names when debugging
  target: "esnext",
  outDir: "dist",
})
