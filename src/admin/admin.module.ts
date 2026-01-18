import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminUpdate } from './admin.update';
import { PrismaModule } from '../prisma/prisma.module';
import { ReportModule } from '../report/report.module';

@Module({
  imports: [PrismaModule, ReportModule],
  providers: [AdminService, AdminUpdate],
  exports: [AdminService],
})
export class AdminModule {}
