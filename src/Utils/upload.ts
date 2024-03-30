const axios = require('axios');
const fs = require('fs');
import { barkleKey } from "..";
import { getCurrentTimestamp, logWithTimestamp } from "./lwt";

export const upload = async (image: string) => {
try {
    const driveResponse = await axios.post('https://barkle.chat/api/drive/files/upload-from-url', {
      url: image,
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
            Authorization: barkleKey,
          },
        });

        if (driveFiles.status === 200) {
          const fileIds = [driveFiles.data[0].id];
          return fileIds;
          //await postUpdate(`The NASA astronomy picture of the day is in!\n**${nasaTitle}**\n\n${nasaDescription}\n\nCopyright: ${nasaCopyright}`, fileIds);
        } else {
          logWithTimestamp("No files found in the drive.");
          fs.appendFileSync('bot.log', `${getCurrentTimestamp()} - No files found in the drive\n`);
        }
      }, 60000); // Wait for 1 minute before checking the drive
    } else {
      throw new Error(`Error uploading image to drive 2. Status code: ${driveResponse.status}`);
    }
  } catch (driveError: string | any) {
    logWithTimestamp(`Error uploading image to the drive 1: ${driveError.message}`);
  }
}