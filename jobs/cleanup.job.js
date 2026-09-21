const cron = require("node-cron");
const cleanupUnverifiedUsers = require("./cleanupUnverifiedUsers");
const cleanupExpiredRefreshTokens = require("./cleanupExpiredRefreshTokens");

cron.schedule("0 * * * *", async () => {
  await cleanupUnverifiedUsers();
  await cleanupExpiredRefreshTokens();
});