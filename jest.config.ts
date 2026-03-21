import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/scripts/**',
    '!src/server.ts',
    '!src/types/**',
  ],
  coverageDirectory: 'coverage',
  setupFilesAfterFramework: [],
  setupFiles: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
  verbose: true,
};

export default config;
