import * as dotenv from 'dotenv';
import { checkNasa } from './getNasa';
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

const runScheduledJob = () => {
  logWithTimestamp('Scheduled job starting...');
  let db: any = {};
  if (fs.existsSync('db.json')) {
    db = JSON.parse(fs.readFileSync('db.json', 'utf-8'));
  }
  previouseNasa = db.lastNasa || 'Input';
  schedule.scheduleJob('*/20 * * * *', async () => {
    const nasaData = await checkNasa();
    if (nasaData) {
      const fileIds = await upload(nasaData.url);
      if (fileIds) {
        await postUpdate(`The NASA astronomy picture of the day is in!\n**${nasaData.title}**\n\n${nasaData.description}\n\nCopyright: ${nasaData.copyright}`, fileIds);
      }
    }
  });
  const nextRunTime = schedule.scheduledJobs[Object.keys(schedule.scheduledJobs)[0]].nextInvocation();
  logWithTimestamp(`Next scheduled run time: ${nextRunTime}`);
};

const triggerManualCheck = async () => {
  logWithTimestamp('Manual trigger activated...');
  const nasaData = await checkNasa();
  if (nasaData) {
    const fileIds = await upload(nasaData.url);
    if (fileIds) {
      await postUpdate(`The NASA astronomy picture of the day is in!\n**${nasaData.title}**\n\n${nasaData.description}\n\nCopyright: ${nasaData.copyright}`, fileIds);
    }
  }
};

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', (str, key) => {
  if (key.name === 't' && !key.ctrl) {
    triggerManualCheck();
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