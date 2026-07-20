"use strict";

const base = require("./playwright.config");

module.exports = {
  ...base,
  use: {
    ...base.use,
    launchOptions: {
      executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    },
  },
};
