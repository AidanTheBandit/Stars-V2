const axios = require('axios');
const fs = require('fs');
import { barkleKey } from "..";
import { getCurrentTimestamp, logWithTimestamp } from "./lwt";

export const postUpdate = async (message: string, fileIds: string) => {
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