import { defineConfig } from "@playwright/test";

// Start frontend and API against an isolated test database before running journeys.
export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
  },
});
