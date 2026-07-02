const { createWhitepaperHandler } = require("../lib/whitepaper");

module.exports = createWhitepaperHandler({
  title: "CourtEyeIQ Partner Overview",
  description: "Partner and investor overview. Enter the shared password to continue.",
  path: "/whitepaper-lite",
  routeKey: "whitepaper_lite",
  passwordEnv: "WHITEPAPER_LITE_PASSWORD",
  contentPath: "api/_content/whitepaper-lite.md",
});
