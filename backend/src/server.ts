import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/db.js';

const app = createApp();

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('Database connected successfully.');

    app.listen(env.PORT, () => {
      console.log(`Server is running in ${env.NODE_ENV} mode on http://localhost:${env.PORT}`);
      console.log(`API Docs available at http://localhost:${env.PORT}/api/docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
