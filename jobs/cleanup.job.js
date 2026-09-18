const cron = require("node-cron");
const cleanupUnverifiedUsers = require("./cleanupUnverifiedUsers");

cron.schedule("0 * * * *", async () => {
  await cleanupUnverifiedUsers();
});