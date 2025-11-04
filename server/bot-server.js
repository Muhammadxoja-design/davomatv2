// Bot server - runs Telegram bot
const { startBot } = require('../bot/index');
const NotificationService = require('../bot/services/notificationService');
const { bot } = require('../bot/index');

async function main() {
  try {
    // Start bot
    await startBot();
    
    // Start notification services
    const notificationService = new NotificationService(bot);
    notificationService.startAll();
    
    console.log('🎉 Bot server running!');
  } catch (error) {
    console.error('❌ Bot server error:', error);
    process.exit(1);
  }
}

main();
