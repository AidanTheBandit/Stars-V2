export const getCurrentTimestamp = () => {
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substr(0, 19);
    return timestamp;
  };
  
 export const logWithTimestamp = (message: string) => {
    const timestamp = getCurrentTimestamp();
    console.log(`${timestamp} - ${message}`);
  };