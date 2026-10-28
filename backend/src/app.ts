import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { sendError } from './utils/response.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createApp = (): Express => {
  const app = express();

  // Middleware
  app.use(cors({
    origin: '*',
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Swagger Documentation
  try {
    const swaggerDocPath = path.resolve(__dirname, 'docs/swagger.json');
    if (fs.existsSync(swaggerDocPath)) {
      const swaggerDocument = JSON.parse(fs.readFileSync(swaggerDocPath, 'utf8'));
      app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    }
  } catch (err) {
    console.warn('Failed to load swagger documentation:', err);
  }

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // Main API Routes
  app.use('/api', routes);

  // 404 Route Handler
  app.use((_req: Request, res: Response) => {
    sendError(res, 'Endpoint tidak ditemukan', 404);
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
