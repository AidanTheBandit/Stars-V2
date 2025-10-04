const axios = require('axios');
const fs = require('fs');
import { barkleKey } from "..";
import { getCurrentTimestamp, logWithTimestamp } from "./lwt";

export const upload = async (image: string, token: string): Promise<string[] | undefined> => {
  try {
    const driveResponse = await axios.post('https://barkle.chat/api/drive/files/upload-from-url', {
      url: image,
      force: true,
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (driveResponse.status === 204) {
      // Wait for 1 minute before checking the drive
      await new Promise(resolve => setTimeout(resolve, 60000));

      const driveFiles = await axios.post('https://barkle.chat/api/drive/files', {
        limit: 1,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (driveFiles.status === 200) {
        const fileIds = [driveFiles.data[0].id];
        return fileIds;
      } else {
        logWithTimestamp("No files found in the drive.");
        fs.appendFileSync('bot.log', `${getCurrentTimestamp()} - No files found in the drive\n`);
        return undefined;
      }
    } else {
      throw new Error(`Error uploading image to drive. Status code: ${driveResponse.status}`);
    }
  } catch (driveError: any) {
    logWithTimestamp(`Error uploading image to the drive: ${driveError.message}`);
    return undefined;
  }
}