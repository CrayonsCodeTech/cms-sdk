import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  // Keep .mjs/.cjs/.d.mts/.d.cts names whatever tsdown's defaults become:
  // package.json's main, module, types and exports point at them.
  fixedExtension: true,
})
