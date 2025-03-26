import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    globalSetup: ['./src/test/global-setup.ts'],
    alias: {
      '#root': path.resolve(__dirname, './src'),
      '#common': path.resolve(__dirname, './src/common'),
      '#features': path.resolve(__dirname, './src/features'),
      '#server': path.resolve(__dirname, './src/server'),
      '#test': path.resolve(__dirname, './src/test'),
      '@monorepo-starter/api-common': path.resolve(__dirname, '../packages/api-common/src'),
      '@monorepo-starter/models': path.resolve(__dirname, '../packages/models/src')
    },
    include: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(test).ts?(x)'],
    environmentOptions: {
      env: {
        NODE_ENV: 'test'
      }
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'src/test/']
    },
    root: '.',
    resolveSnapshotPath: (testPath, snapExtension) => 
      testPath.replace(/\.test\.([tj]sx?)$/, `.test${snapExtension}.$1`),
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    conditions: ['import', 'node'],
    mainFields: ['module', 'main']
  }
}); 