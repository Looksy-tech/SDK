"use strict";

const { spawnSync } = require("child_process");

const result = spawnSync(
  "npx",
  ["playwright", "test", "-c", "regression-tests/playwright.config.js", "--project=capture"],
  { stdio: "inherit" },
);

process.exit(result.status == null ? 1 : result.status);
