const axios = require('axios');
const fs = require('fs');
import { nasaKey, barkleKey } from ".";
import { getCurrentTimestamp, logWithTimestamp } from "./Utils/lwt";

let previouseNasa = 'DATE';
interface NasaData {
  url: string;
  title: string;
  description: string;
  copyright?: string;
}

export const checkNasa = async (): Promise<NasaData | null> => {
    try {
      logWithTimestamp('Preparing to check NASA field...');
      const response = await axios.get('https://api.nasa.gov/planetary/apod', {
        params: {
          api_key: nasaKey,
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
          fs.writeFileSync('db.json', JSON.stringify({ lastCheck: new Date(), lastNasa: previouseNasa }));
          
          return {
            url: nasaIMG,
            title: nasaTitle,
            description: nasaDescription,
            copyright: nasaCopyright
          };
        } else {
          logWithTimestamp("NASA image has not changed.");
          fs.appendFileSync('bot.log', `${getCurrentTimestamp()} - No new NASA image\n`);

          return null;
        }

      } else {
        logWithTimestamp(`NASA API returned a non-image media type`);
        fs.appendFileSync('bot.log', `${getCurrentTimestamp()} - NASA API returned a non-image media type\n`);
        return null;
      }
    } catch (error: any) {
      logWithTimestamp(`Error in checkNasa: ${error}`);
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
      return null;
    }
  };

export const getCurrentNasa = async (): Promise<{url: string, title: string, description: string, copyright: string} | null> => {
  try {
    logWithTimestamp('Fetching current NASA APOD...');
    const response = await axios.get('https://api.nasa.gov/planetary/apod', {
      params: {
        api_key: nasaKey,
      },
    });

    if (response.data.media_type === 'image') {
      return {
        url: response.data.hdurl,
        title: response.data.title,
        description: response.data.explanation,
        copyright: response.data.copyright
      };
    } else {
      logWithTimestamp(`NASA API returned a non-image media type`);
      return null;
    }
  } catch (error: any) {
    logWithTimestamp(`Error fetching NASA: ${error.message}`);
    return null;
  }
};