import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    entry: 'src/index.ts',
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
  },
  {
    entry: 'src/cli.ts',
    format: ['esm'],
    dts: false,
    banner: { js: '#!/usr/bin/env node' },
  },
]);
