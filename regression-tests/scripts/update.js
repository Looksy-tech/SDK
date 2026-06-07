"use strict";

const { spawnSync } = require("child_process");

const result = spawnSync(
  "npx",
  ["playwright", "test", "-c", "regression-tests/playwright.config.js", "--project=regression", "--update-snapshots"],
  { stdio: "inherit" },
);

process.exit(result.status == null ? 1 : result.status);
