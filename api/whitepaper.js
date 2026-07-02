const { createWhitepaperHandler } = require("../lib/whitepaper");

module.exports = createWhitepaperHandler({
  title: "CourtEyeIQ Whitepaper",
  description: "Internal technical whitepaper. Enter the shared password to continue.",
  path: "/whitepaper",
  routeKey: "whitepaper",
  passwordEnv: "WHITEPAPER_PASSWORD",
  contentPath: "content/whitepaper.md",
});
