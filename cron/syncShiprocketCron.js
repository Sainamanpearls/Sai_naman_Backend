// cron/syncShiprocketCron.js
const cron = require('node-cron');
const { syncShiprocketStatus } = require('../services/syncShiprocketStatus');

// Run every 3 hours
cron.schedule('0 */3 * * *', async () => {
  console.log(' Running scheduled Shiprocket status sync...');
  await syncShiprocketStatus();
});
