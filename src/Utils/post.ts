const axios = require('axios');
const fs = require('fs');
import { barkleKey } from "..";
import { getCurrentTimestamp, logWithTimestamp } from "./lwt";

export const postUpdate = async (message: string, fileIds: string[], token: string) => {
    try {
      logWithTimestamp('Preparing to post update to Barkle.Chat...');
  
    const response = await axios.post('https://barkle.chat/api/notes/create', {
      text: message,
      barkleFor: "Barkle API",
      fileIds: fileIds,
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Content-Type': 'application/json',
        'Sec-CH-UA': '"Google Chrome";v="91", "Chromium";v="91", ";Not A Brand";v="99"',
        'Sec-CH-UA-Mobile': '?0',
        'Sec-CH-UA-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
      },
    });      logWithTimestamp(`Posted update to Barkle.Chat successfully: ${response.data}`);
    } catch (error: any) {
      logWithTimestamp(`Error in postUpdate to Barkle.Chat: ${error.message}`);
      if (error.response) {
        logWithTimestamp(`Error data: ${error.response.data}`);
        logWithTimestamp(`Error status: ${error.response.status}`);
        logWithTimestamp(`Error headers: ${error.response.headers}`);
      } else if (error.request) {
        logWithTimestamp(`Error request: ${error.request}`);
      } else {
        logWithTimestamp(`General Error: ${error.message}`);
      }
      logWithTimestamp(`Error config: ${error.config}`);
    }
  };