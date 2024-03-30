const readline = require('readline');
const axios = require('axios');
const schedule = require('node-schedule');
const fs = require('fs');

let previouseNasa = 'DATE';
const bAPI = "Bearer fzNPQk4njCXHvO8PAvtoa1FsNq9QZsEB";
const nAPI = "XShqnCHtoIHwkM2kIuAGChAM1J8KmfpgKb4JZdgK";

console.log('Bot started');

const getCurrentTimestamp = () => {
  const now = new Date();
  const timestamp = now.toISOString().replace('T', ' ').substr(0, 19);
  return timestamp;
};

const logWithTimestamp = (message) => {
  const timestamp = getCurrentTimestamp();
  console.log(`${timestamp} - ${message}`);
};

const checkNasa = async () => {
  try {
    logWithTimestamp('Preparing to check NASA field...');
    const response = await axios.get('https://api.nasa.gov/planetary/apod', {
      params: {
        api_key: nAPI,
      },
    });

    logWithTimestamp('Got response from NASA API...');

    if (response.data.media_type === 'image') {
      const nasaIMG = response.data.hdurl;
      const nasaTitle = response.data.title;
      const nasaDescription = response.data.explanation;
      const nasaCopyright = response.data.copyright;

      if (previouseNasa !== nasaIMG) {
        logWithTimestamp(`NASA image updated. New URL: ${nasaIMG}`);
        fs.appendFileSync('bot.log', `${getCurrentTimestamp()} - NASA image updated. New URL: ${nasaIMG}\n`);
        previouseNasa = nasaIMG;

        try {
          const driveResponse = await axios.post('https://barkle.chat/api/drive/files/upload-from-url', {
            url: nasaIMG,
            force: true,
          }, {
            headers: {
              Authorization: 'Bearer fzNPQk4njCXHvO8PAvtoa1FsNq9QZsEB',
            },
          });

          if (driveResponse.status === 204) {
            setTimeout(async () => {
              const driveFiles = await axios.post('https://barkle.chat/api/drive/files', {
                limit: 1,
              }, {
                headers: {
                  Authorization: bAPI,
                },
              });

              if (driveFiles.status === 200) {
                const fileIds = [driveFiles.data[0].id];
                await postUpdate(`The NASA astronomy picture of the day is in!\n**${nasaTitle}**\n\n${nasaDescription}\n\nCopyright: ${nasaCopyright}`, fileIds);
              } else {
                logWithTimestamp("No files found in the drive.");
                fs.appendFileSync('bot.log', `${getCurrentTimestamp()} - No files found in the drive\n`);
              }
            }, 60000); // Wait for 1 minute before checking the drive
          } else {
            throw new Error(`Error uploading image to drive 2. Status code: ${driveResponse.status}`);
          }
        } catch (driveError) {
          logWithTimestamp(`Error uploading image to the drive 1: ${driveError.message}`);
        }
      } else {
        logWithTimestamp("NASA image has not changed.");
        fs.appendFileSync('bot.log', `${getCurrentTimestamp()} - No new NASA image\n`);
      }

      fs.writeFileSync('db.json', JSON.stringify({ lastCheck: new Date(), lastNasa: previouseNasa }));
    } else {
      logWithTimestamp(`NASA API returned a non-image media type`);
      fs.appendFileSync('bot.log', `${getCurrentTimestamp()} - NASA API returned a non-image media type\n`);
    }
  } catch (error) {
    logWithTimestamp('Error in checkNasa', error);
    if (error.response) {
      logWithTimestamp('Error data', error.response.data);
      logWithTimestamp('Error status', error.response.status);
      logWithTimestamp('Error headers', error.response.headers);
    } else if (error.request) {
      logWithTimestamp('Error request', error.request);
    } else {
      logWithTimestamp('General Error', error.message);
    }
    logWithTimestamp('Error config', error.config);
  }
};

const postUpdate = async (message, fileIds) => {
  try {
    logWithTimestamp('Preparing to post update to Barkle.Chat...');

    const response = await axios.post('https://barkle.chat/api/notes/create', {
      text: message,
      barkleFor: "Barkle API",
      fileIds: fileIds,
    }, {
      headers: {
        Authorization: 'Bearer fzNPQk4njCXHvO8PAvtoa1FsNq9QZsEB',
      },
    });

    logWithTimestamp('Posted update to Barkle.Chat successfully:', response.data);
  } catch (error) {
    logWithTimestamp('Error in postUpdate to Barkle.Chat:', error.message);
    if (error.response) {
      logWithTimestamp('Error data', error.response.data);
      logWithTimestamp('Error status', error.response.status);
      logWithTimestamp('Error headers', error.response.headers);
    } else if (error.request) {
      logWithTimestamp('Error request', error.request);
    } else {
      logWithTimestamp('General Error', error.message);
    }
    logWithTimestamp('Error config', error.config);
  }
};

const runScheduledJob = () => {
  logWithTimestamp('Scheduled job starting...');
  let db = {};
  if (fs.existsSync('db.json')) {
    db = JSON.parse(fs.readFileSync('db.json'));
  }
  previouseNasa = db.lastNasa || 'Input';
  schedule.scheduleJob('*/20 * * * *', checkNasa);
  const nextRunTime = schedule.scheduledJobs[Object.keys(schedule.scheduledJobs)[0]].nextInvocation();
  logWithTimestamp(`Next scheduled run time: ${nextRunTime}`);
};

const triggerManualCheck = () => {
  logWithTimestamp('Manual trigger activated...');
  checkNasa();
};

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', (str, key) => {
  if (key.name === 't' && key.ctrl === false) {
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
