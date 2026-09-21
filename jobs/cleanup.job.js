const cron = require("node-cron");
const cleanupUnverifiedUsers = require("./cleanupUnverifiedUsers");
const cleanupExpiredRefreshTokens = require("./cleanupExpiredRefreshTokens");
const cleanupExpiredPasswordResetTokens = require("./cleanupExpiredPasswordResetTokens");

cron.schedule("0 * * * *", async () => {
  await cleanupUnverifiedUsers();
  await cleanupExpiredRefreshTokens();
  await cleanupExpiredPasswordResetTokens();
});