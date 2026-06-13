"use strict";

const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const REGRESSION_DIR = __dirname;
const LOCAL_ORIGIN = process.env.LOOKSY_REGRESSION_ORIGIN || "http://looksy-regression.local";

module.exports = {
  ROOT_DIR,
  REGRESSION_DIR,
  LOCAL_ORIGIN,
  SDK_SCRIPT_PATH: process.env.LOOKSY_SDK_SCRIPT || path.join(ROOT_DIR, "script", "script.js"),
  PAGES_CONFIG_PATH: path.join(REGRESSION_DIR, "pages.config.json"),
  FIXTURES_DIR: path.join(REGRESSION_DIR, "fixtures"),
  BASELINES_DIR: path.join(REGRESSION_DIR, "baselines"),
  LATEST_DIR: path.join(REGRESSION_DIR, "latest"),
  MOCK_WIDGET_PATH: path.join(REGRESSION_DIR, "public", "mock-widget.html"),
  VIEWPORTS: {
    desktop: { width: 1440, height: 1100 },
    mobile: { width: 390, height: 844 },
  },
  BUTTON_BOX_TOLERANCE_PX: 8,
};
