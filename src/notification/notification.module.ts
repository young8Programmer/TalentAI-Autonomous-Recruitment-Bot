import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { ConfigModule } from '@nestjs/config';
import { BotModule } from '../bot/bot.module';

@Module({
  imports: [ConfigModule, BotModule],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
