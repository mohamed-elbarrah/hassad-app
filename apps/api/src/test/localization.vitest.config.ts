import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "src/test/request-locale.spec.ts",
      "src/test/localization-transport.spec.ts",
      "src/test/snooze-reminder.scheduler.spec.ts",
    ],
    environment: "node",
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
  },
});
