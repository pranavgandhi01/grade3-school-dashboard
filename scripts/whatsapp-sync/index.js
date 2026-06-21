import qrcode from 'qrcode-terminal';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import cron from 'node-cron';
import dotenv from 'dotenv';
dotenv.config();

import { parseWhatsAppMessage } from './geminiParser.js';
import { uploadDailyUpdate, listenForSyncRequest, clearSyncRequest } from './firebaseClient.js';

// The WhatsApp group name to watch
const TARGET_GROUP_NAME = process.env.WHATSAPP_GROUP_NAME || 'Grade 3B Updates';

console.log('Initializing WhatsApp Client...');

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true } // Runs invisibly in the background
});

client.on('qr', (qr) => {
  console.log('SCAN THIS QR CODE WITH YOUR WHATSAPP TO LOG IN:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ WhatsApp Web Client is Ready!');
  
  // Listen for Dashboard Sync Requests
  listenForSyncRequest(async () => {
    await performSync();
    await clearSyncRequest();
  });
});

// Automatically trigger sync every weekday (Monday-Friday) at 2:30 PM
cron.schedule('30 14 * * 1-5', async () => {
  console.log('⏰ Scheduled sync triggered (2:30 PM)');
  await performSync();
});

async function performSync() {
  console.log(`Searching for latest updates in group: "${TARGET_GROUP_NAME}"...`);
  try {
    const chats = await client.getChats();
    const groupChat = chats.find(c => c.isGroup && c.name.includes(TARGET_GROUP_NAME));
    
    if (!groupChat) {
      console.error(`❌ Could not find group: ${TARGET_GROUP_NAME}`);
      return;
    }

    // Fetch the last 20 messages to find the daily update
    const messages = await groupChat.fetchMessages({ limit: 20 });
    
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.body && msg.body.toLowerCase().includes('daily update') && msg.body.includes('3B')) {
        console.log('Found a Daily Update message! Processing with Gemini AI...');
        
        const parsedJson = await parseWhatsAppMessage(msg.body);
        if (parsedJson && parsedJson.date) {
          console.log(`Structured Data parsed for ${parsedJson.date}`);
          await uploadDailyUpdate(parsedJson.date, parsedJson);
          break; // Stop after processing the most recent update
        } else {
          console.log("Failed to parse message correctly.");
        }
      }
      
      // If there's an attachment (like a PDF), we can download it
      if (msg.hasMedia) {
        // const media = await msg.downloadMedia();
        // console.log(`Downloaded media: ${media.filename}`);
        // TODO: Implement Firebase Storage upload here
      }
    }
  } catch (err) {
    console.error("Sync Error:", err);
  }
}

client.initialize();
