const axios = require('axios');
const fs = require('fs');
import { barkleKey } from "..";
import { getCurrentTimestamp, logWithTimestamp } from "./lwt";

export const upload = async (imageUrl: string, token: string): Promise<string[] | undefined> => {
  try {
    // First, download the image
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (imageResponse.status !== 200) {
      throw new Error(`Failed to download image. Status: ${imageResponse.status}`);
    }

    const imageBuffer = Buffer.from(imageResponse.data);
    const fileName = `nasa-apod-${Date.now()}.jpg`; // Assuming JPEG, but could be determined from content-type

    // Now upload to Misskey drive
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', imageBuffer, { filename: fileName });
    form.append('i', token); // Access token

    const uploadResponse = await axios.post('https://barkle.chat/api/drive/files/create', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`,
      },
    });

    if (uploadResponse.status === 200) {
      const fileId = uploadResponse.data.id;
      logWithTimestamp(`Uploaded file with ID: ${fileId}`);
      return [fileId];
    } else {
      throw new Error(`Error uploading to drive. Status: ${uploadResponse.status}`);
    }
  } catch (error: any) {
    logWithTimestamp(`Error uploading image: ${error.message}`);
    return undefined;
  }
}