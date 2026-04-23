import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
import express, { type Request, type Response } from 'express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import { AppModule } from './app.module';

dotenv.config();

const LEGACY_FALLBACK = (process.env.LEGACY_FALLBACK_ORIGIN || '').replace(
  /\/$/,
  '',
);

function legacyRuntimePath(...segments: string[]) {
  return path.join(process.cwd(), 'legacy-runtime', ...segments);
}

async function bootstrap() {
  const server = express();
  server.use(cors({ origin: true, credentials: true }));
  server.use(express.json({ limit: '20mb' }));
  server.use(express.urlencoded({ extended: true, limit: '20mb' }));

  server.get('/health', (_req: Request, res: Response) => {
    res.json({ ok: true, status: 'live' });
  });

  const googleId =
    process.env.GOOGLE_CLIENT_ID ||
    process.env['GOOGLE-CLIENT-ID'] ||
    'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

  server.get('/api/config', (_req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json({ google_client_id: googleId });
  });

  server.get('/api/health', async (_req: Request, res: Response) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const db = require(legacyRuntimePath('config', 'db')) as {
        queryOne: (sql: string, params?: unknown[]) => Promise<unknown>;
      };
      const ADMIN_EMAIL =
        process.env.ADMIN_EMAIL || 'admin@bodybank.fit';
      const SUPERADMIN_EMAIL =
        process.env.SUPERADMIN_EMAIL || 'superadmin@bodybank.fit';
      const adminCheck = await db.queryOne(
        "SELECT email FROM users WHERE role='admin' LIMIT 1",
      );
      const superadminCheck = await db.queryOne(
        "SELECT email FROM users WHERE role='superadmin' LIMIT 1",
      );
      res.json({
        ok: true,
        db: 'connected',
        admin_email: ADMIN_EMAIL,
        admin_exists: !!adminCheck,
        superadmin_email: SUPERADMIN_EMAIL,
        superadmin_exists: !!superadminCheck,
      });
    } catch (e) {
      const err = e as Error;
      res.status(500).json({ ok: false, db: 'error', error: err.message });
    }
  });

  // Migrated first-class route: same Express router as the legacy app
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const progressRouter = require(legacyRuntimePath('routes', 'progress'));
  server.use('/api/progress', progressRouter);

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: ['error', 'warn', 'log'],
    bodyParser: false,
  });

  if (LEGACY_FALLBACK) {
    server.use(
      createProxyMiddleware({
        target: LEGACY_FALLBACK,
        changeOrigin: true,
      }),
    );
  }

  const port = parseInt(process.env.PORT || '3002', 10);
  await app.listen(port);
}

void bootstrap();
