import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db.js';
import { logger } from './utils/logger.js';
import { initSocketServer } from './services/socketService.js';
import { SchedulerService } from './services/schedulerService.js';
import { BaileysEngine } from './services/baileysEngine.js';
import { CampaignService } from './services/campaignService.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import instanceRoutes from './routes/instanceRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import importRoutes from './routes/importRoutes.js';
import antibanRoutes from './routes/antibanRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';
import autoReplyRoutes from './routes/autoReplyRoutes.js';
import blacklistRoutes from './routes/blacklistRoutes.js';
import crmRoutes from './routes/crmRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import premiumRoutes from './routes/premiumRoutes.js';
import publicV1Routes from './routes/publicV1Routes.js';
import licenseRoutes from './routes/licenseRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
import contactGroupRoutes from './routes/contactGroupRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

const rootDir = path.resolve();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io Realtime Service
initSocketServer(server);

// Security & Utility Middlewares
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  'http://localhost:3000,http://localhost:4000,https://voxora.roasbodhi.in'
)
  .split(',')
  .map((s) => s.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS policy: Access blocked for this origin'));
      }
    },
    credentials: true,
  })
);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Static File Storage Access (for uploaded attachments & QR codes)
app.use('/uploads', express.static(path.join(rootDir, 'uploads')));

// Rate Limiting
app.use('/api', apiRateLimiter);

// API Route Registration
app.use('/api/auth', authRoutes);
app.use('/api/instances', instanceRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/contacts', importRoutes);
app.use('/api/antiban', antibanRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/autoreply', autoReplyRoutes);
app.use('/api/blacklist', blacklistRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/premium', premiumRoutes);
app.use('/api/v1', publicV1Routes);
app.use('/api/license', licenseRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/groups', contactGroupRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Static Frontend Serving (Desktop & Production Mode)
const possibleFrontendPaths = [
  path.join(rootDir, '../frontend/out'),
  path.join(rootDir, 'resources/frontend/out'),
  path.join(process.cwd(), 'resources/frontend/out'),
  path.join(rootDir, 'frontend/out'),
];

let frontendDir = possibleFrontendPaths.find((p) => fs.existsSync(p));

if (frontendDir) {
  logger.info(`[Static Server] Serving frontend out directory from: ${frontendDir}`);
  app.use(express.static(frontendDir));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    const cleanPath = req.path.endsWith('/') ? req.path.slice(0, -1) : req.path;
    const htmlFile = path.join(frontendDir!, `${cleanPath}.html`);
    const indexFile = path.join(frontendDir!, cleanPath, 'index.html');

    if (fs.existsSync(htmlFile)) {
      return res.sendFile(htmlFile);
    } else if (fs.existsSync(indexFile)) {
      return res.sendFile(indexFile);
    } else {
      return res.sendFile(path.join(frontendDir!, 'index.html'));
    }
  });
} else {
  logger.warn('[Static Server] frontend/out directory not found. Running in headless API mode.');
}

// Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

connectDB().then(() => {
  server.listen(PORT, () => {
    logger.info(`🚀 VOXORA Backend running on port ${PORT}`);
    SchedulerService.startScheduler();
    BaileysEngine.autoReconnectSavedSessions();
    CampaignService.resumeRunningCampaigns();
  });
});
