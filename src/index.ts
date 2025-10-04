import * as dotenv from 'dotenv';
import axios from 'axios';
import { checkNasa, getCurrentNasa } from './getNasa';
import { upload } from './Utils/upload';
import { postUpdate } from './Utils/post';
import { logWithTimestamp } from './Utils/lwt';
import * as fs from 'fs';
import * as schedule from 'node-schedule';
import * as readline from 'readline';

dotenv.config();

export const barkle = "https://barkle.chat/api";
export const barkleKey = process.env.BARKLE_API_KEY || "";
export const nasaKey = process.env.NASA_API_KEY || "";
export const botUsername = process.env.BOT_USERNAME || "";

let previouseNasa = 'DATE';
let repliedIds: string[] = [];

const runScheduledJob = () => {
  logWithTimestamp('Scheduled job starting...');
  let db: any = {};
  if (fs.existsSync('db.json')) {
    db = JSON.parse(fs.readFileSync('db.json', 'utf-8'));
  }
  previouseNasa = db.lastNasa || 'Input';
  repliedIds = db.repliedIds || [];
  schedule.scheduleJob('*/20 * * * *', async () => {
    const nasaData = await checkNasa();
    if (nasaData) {
      // Post with image URL in text instead of uploading
      await postUpdate(`The NASA astronomy picture of the day is in!\n**${nasaData.title}**\n\n${nasaData.description}\n\nCopyright: ${nasaData.copyright}\n\nImage: ${nasaData.url}`, [], barkleKey);
    }
  });
  const nextRunTime = schedule.scheduledJobs[Object.keys(schedule.scheduledJobs)[0]].nextInvocation();
  logWithTimestamp(`Next scheduled run time: ${nextRunTime}`);

  schedule.scheduleJob('*/1 * * * *', async () => {
    try {
      const response = await axios.get(`${barkle}/notifications`, {
        headers: {
          Authorization: `Bearer ${barkleKey}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Content-Type': 'application/json',
          'Origin': 'https://barkle.chat',
          'Referer': 'https://barkle.chat/',
          'Sec-CH-UA': '"Google Chrome";v="91", "Chromium";v="91", ";Not A Brand";v="99"',
          'Sec-CH-UA-Mobile': '?0',
          'Sec-CH-UA-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
        },
        params: {
          limit: 10
        }
      });
      if (response.status === 200) {
        const notifications = response.data;
        logWithTimestamp(`Polled ${notifications.length} notifications`);
        for (const notif of notifications) {
          logWithTimestamp(`Notification type: ${notif.type}`);
          if (notif.type === 'mention' && notif.note && notif.note.text && notif.note.text.includes(`@${botUsername}`) && !repliedIds.includes(notif.note.id)) {
            logWithTimestamp(`Mention found in note ${notif.note.id}`);
            const nasaData = await getCurrentNasa();
            if (nasaData) {
              await axios.post(`${barkle}/notes/create`, {
                text: `Here's the current NASA Astronomy Picture of the Day!\n**${nasaData.title}**\n\n${nasaData.description}\n\nCopyright: ${nasaData.copyright}\n\nImage: ${nasaData.url}`,
                replyId: notif.note.id,
              }, {
                headers: {
                  Authorization: `Bearer ${barkleKey}`,
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                  'Accept': 'application/json, text/plain, */*',
                  'Accept-Language': 'en-US,en;q=0.9',
                  'Content-Type': 'application/json',
                  'Origin': 'https://barkle.chat',
                  'Referer': 'https://barkle.chat/',
                  'Sec-CH-UA': '"Google Chrome";v="91", "Chromium";v="91", ";Not A Brand";v="99"',
                  'Sec-CH-UA-Mobile': '?0',
                  'Sec-CH-UA-Platform': '"Windows"',
                  'Sec-Fetch-Dest': 'empty',
                  'Sec-Fetch-Mode': 'cors',
                  'Sec-Fetch-Site': 'same-origin',
                },
              });
              repliedIds.push(notif.note.id);
              fs.writeFileSync('db.json', JSON.stringify({ lastCheck: new Date(), lastNasa: previouseNasa, repliedIds }));
              logWithTimestamp('Replied to mention');
            }
          }
        }
      }
    } catch (error: any) {
      logWithTimestamp(`Error polling notifications: ${error.message}`);
    }
  });
};

const triggerManualCheck = async () => {
  logWithTimestamp('Manual trigger activated...');
  const nasaData = await checkNasa();
  if (nasaData) {
    await postUpdate(`The NASA astronomy picture of the day is in!\n**${nasaData.title}**\n\n${nasaData.description}\n\nCopyright: ${nasaData.copyright}\n\nImage: ${nasaData.url}`, [], barkleKey);
  }
};

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', (str, key) => {
  if (key.name === 't' && !key.ctrl) {
    triggerManualCheck();
  }
  if (key.name === 'p' && !key.ctrl) {
    // Manual poll for notifications
    (async () => {
      try {
        const response = await axios.get(`${barkle}/notifications`, {
          headers: {
            Authorization: `Bearer ${barkleKey}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Content-Type': 'application/json',
            'Origin': 'https://barkle.chat',
            'Referer': 'https://barkle.chat/',
            'Sec-CH-UA': '"Google Chrome";v="91", "Chromium";v="91", ";Not A Brand";v="99"',
            'Sec-CH-UA-Mobile': '?0',
            'Sec-CH-UA-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
          },
          params: {
            limit: 10
          }
        });
        if (response.status === 200) {
          const notifications = response.data;
          logWithTimestamp(`Manual poll: ${notifications.length} notifications`);
          for (const notif of notifications) {
            logWithTimestamp(`Notification type: ${notif.type}`);
            if (notif.type === 'mention' && notif.note && notif.note.text && notif.note.text.includes(`@${botUsername}`) && !repliedIds.includes(notif.note.id)) {
              logWithTimestamp(`Mention found in note ${notif.note.id}`);
              const nasaData = await getCurrentNasa();
              if (nasaData) {
                await axios.post(`${barkle}/notes/create`, {
                  text: `Here's the current NASA Astronomy Picture of the Day!\n**${nasaData.title}**\n\n${nasaData.description}\n\nCopyright: ${nasaData.copyright}\n\nImage: ${nasaData.url}`,
                  replyId: notif.note.id,
                }, {
                  headers: {
                    Authorization: `Bearer ${barkleKey}`,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Content-Type': 'application/json',
                    'Origin': 'https://barkle.chat',
                    'Referer': 'https://barkle.chat/',
                  },
                });
                repliedIds.push(notif.note.id);
                fs.writeFileSync('db.json', JSON.stringify({ lastCheck: new Date(), lastNasa: previouseNasa, repliedIds }));
                logWithTimestamp('Replied to mention');
              }
            }
          }
        }
      } catch (error: any) {
        logWithTimestamp(`Error manual polling notifications: ${error.message}`);
      }
    })();
  }
  if (key.name === 'c' && key.ctrl) {
    process.exit();
  }
});

const trigger = process.argv.includes('--trigger');
if (trigger) {
  triggerManualCheck();
} else {
  runScheduledJob();
}