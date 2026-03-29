import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    pool: "forks",
    poolOptions: {
      forks: {
        execArgv: ["--experimental-vm-modules"],
      },
    },
    include: ["src/**/*.test.ts"],
  },
});
