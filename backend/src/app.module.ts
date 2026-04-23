import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';

/**
 * Phase 2: HTTP surface is wired in `main.ts` (Express + migrated routers).
 * Phase 3: Prisma + Nest controllers for selected routes (e.g. /api/health).
 */
@Module({
  imports: [PrismaModule, HealthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
