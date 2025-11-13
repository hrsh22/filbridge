import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/core/index.ts',
    'src/onlyswaps/index.ts',
    'src/synapse/index.ts',
  ],
  format: ['esm'],
  target: 'node20',
  dts: {
    entry: [
      'src/index.ts',
      'src/core/index.ts',
      'src/onlyswaps/index.ts',
      'src/synapse/index.ts',
    ],
  },
  clean: true,
  sourcemap: true,
  splitting: false,
  outDir: 'dist',
});

