import { Module } from '@nestjs/common';
import { InterviewService } from './interview.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { NotificationModule } from '../notification/notification.module';
import { ReportModule } from '../report/report.module';

@Module({
  imports: [PrismaModule, AiModule, NotificationModule, ReportModule],
  providers: [InterviewService],
  exports: [InterviewService],
})
export class InterviewModule {}
