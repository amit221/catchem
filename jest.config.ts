import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  collectCoverageFrom: ["src/**/*.ts", "src/**/*.tsx", "!src/cli/index.ts"],
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      useESM: true,
      tsconfig: {
        moduleResolution: "bundler",
        module: "esnext",
      },
    }],
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(ink|ink-testing-library|ansi-escapes|chalk|cli-cursor|cli-spinners|is-unicode-supported|log-symbols|ora|restore-cursor|signal-exit|slice-ansi|string-width|strip-ansi|wrap-ansi|widest-line|environment|get-east-asian-width|is-fullwidth-code-point|eastasianwidth|ansi-regex|is-in-ci)/)",
  ],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};

export default config;
