import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Same contract as legacy `server.js` GET /api/health (DB connectivity + admin flags).
   */
  @Get('api/health')
  async apiHealth() {
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@bodybank.fit';
    const SUPERADMIN_EMAIL =
      process.env.SUPERADMIN_EMAIL || 'superadmin@bodybank.fit';

    try {
      const adminRows = await this.prisma.$queryRaw<
        { email: string }[]
      >`SELECT email FROM users WHERE role='admin' LIMIT 1`;
      const superRows = await this.prisma.$queryRaw<
        { email: string }[]
      >`SELECT email FROM users WHERE role='superadmin' LIMIT 1`;

      const adminCheck = adminRows[0];
      const superadminCheck = superRows[0];

      return {
        ok: true,
        db: 'connected',
        admin_email: ADMIN_EMAIL,
        admin_exists: !!adminCheck,
        superadmin_email: SUPERADMIN_EMAIL,
        superadmin_exists: !!superadminCheck,
      };
    } catch (e) {
      const err = e as Error;
      throw new HttpException(
        { ok: false, db: 'error', error: err.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
