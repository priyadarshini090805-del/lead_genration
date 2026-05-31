import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFilesAfterFramework: [],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testPathPattern: "__tests__",
  collectCoverageFrom: [
    "lib/**/*.ts",
    "app/api/**/*.ts",
    "workers/**/*.ts",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
  coverageThreshold: { global: { lines: 70, functions: 70, branches: 60, statements: 70 } },
  transform: { "^.+\\.tsx?$": ["ts-jest", { tsconfig: { jsx: "react-jsx" } }] },
  testTimeout: 15000,
};

export default config;
