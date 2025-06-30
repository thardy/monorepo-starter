import { defineConfig } from 'vitest/config';
import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/__tests__/setup/test-config-setup.ts', './src/__tests__/setup/setup.ts'],
    globalSetup: ['./src/__tests__/setup/global-setup.ts'],
    include: ['src/**/__tests__/**/*.test.ts?(x)', 'src/**/?(*.)+(test).ts?(x)'],
    exclude: ['**/node_modules/**', '**/__tests__/setup/**/*'],
    environmentOptions: {
      env: {
        NODE_ENV: 'test'
      }
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'src/__tests__/setup/']
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