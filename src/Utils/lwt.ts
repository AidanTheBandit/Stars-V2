export const getCurrentTimestamp = () => {
    const now = new Date();
    const estTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const timestamp = estTime.toISOString().replace('T', ' ').substr(0, 19);
    return timestamp;
  };
  
 export const logWithTimestamp = (message: string) => {
    const timestamp = getCurrentTimestamp();
    console.log(`${timestamp} - ${message}`);
  };