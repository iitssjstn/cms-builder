import app from './app';
import { config } from './config';
import { closeDb } from './db';

const server = app.listen(config.port, () => {
  console.log(`Website Builder draait op poort ${config.port}`);
  console.log(`Omgeving: ${config.nodeEnv}`);
});

// Graceful shutdown
function shutdown(signal: string) {
  console.log(`${signal} ontvangen, server wordt afgesloten...`);
  server.close(() => {
    console.log('HTTP server gesloten');
    closeDb();
    console.log('Database verbinding gesloten');
    process.exit(0);
  });
  
  // Forceer afsluiting na 10 seconden
  setTimeout(() => {
    console.error('Gedwongen afsluiting na timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default server;
