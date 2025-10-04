const axios = require('axios');
const fs = require('fs');
import { barkleKey } from "..";
import { getCurrentTimestamp, logWithTimestamp } from "./lwt";

export const upload = async (imageUrl: string, token: string): Promise<string[] | undefined> => {
  try {
    logWithTimestamp(`Starting upload for URL: ${imageUrl}`);

    // Download the image first
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
    const fileName = `nasa-apod-${Date.now()}.jpg`;

    // Upload using multipart/form-data with i parameter
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', imageBuffer, { filename: fileName });
    form.append('i', token);

    logWithTimestamp(`Uploading to Barkle drive...`);
    const uploadResponse = await axios.post('https://barkle.chat/api/drive/files/create', form, {
      headers: {
        ...form.getHeaders(),
      },
    });

    logWithTimestamp(`Upload response status: ${uploadResponse.status}`);
    if (uploadResponse.status === 200) {
      const fileId = uploadResponse.data.id;
      logWithTimestamp(`Uploaded file with ID: ${fileId}`);
      return [fileId];
    } else {
      logWithTimestamp(`Upload failed with status: ${uploadResponse.status}`);
      return undefined;
    }
  } catch (error: any) {
    logWithTimestamp(`Error uploading image: ${error.message}`);
    if (error.response) {
      logWithTimestamp(`Error status: ${error.response.status}`);
      logWithTimestamp(`Error data: ${JSON.stringify(error.response.data)}`);
    }
    return undefined;
  }
}