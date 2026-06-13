"use strict";

const fs = require("fs");
const path = require("path");
const { FIXTURES_DIR } = require("../config");

if (!fs.existsSync(FIXTURES_DIR)) {
  console.log("No fixtures captured yet.");
  process.exit(0);
}

const fixtures = fs.readdirSync(FIXTURES_DIR)
  .filter((name) => fs.existsSync(path.join(FIXTURES_DIR, name, "page.html")))
  .sort();

if (!fixtures.length) {
  console.log("No fixtures captured yet.");
  process.exit(0);
}

for (const fixture of fixtures) {
  console.log(fixture);
}
