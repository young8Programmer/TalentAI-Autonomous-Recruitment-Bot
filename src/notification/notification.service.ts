import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf, Context } from 'telegraf';
import { Interview, Candidate, Vacancy } from '@prisma/client';

interface InterviewWithRelations extends Interview {
  candidate: Candidate;
  vacancy: Vacancy;
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly configService: ConfigService,
  ) {}

  async notifyNewCandidate(interview: InterviewWithRelations, pdfBuffer: Buffer) {
    const hrManagerId = this.configService.get<string>('HR_MANAGER_TELEGRAM_ID');

    if (!hrManagerId) {
      console.warn('HR_MANAGER_TELEGRAM_ID is not set. Skipping notification.');
      return;
    }

    try {
      const chatId = parseInt(hrManagerId);

      // Send notification message
      const message = `
🎯 *Yangi Nomzod Topildi!*

*Nomzod:*
${interview.candidate.firstName || ''} ${interview.candidate.lastName || ''}
Telegram: @${interview.candidate.username || interview.candidate.telegramId}

*Vakansiya:*
${interview.vacancy.title}

*Moslik Balli:*
${interview.matchScore?.toFixed(1) || 0}%

*Suhbat Sana:*
${new Date(interview.createdAt).toLocaleString('uz-UZ')}
      `;

      await this.bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });

      // Send PDF report
      await this.bot.telegram.sendDocument(chatId, {
        source: pdfBuffer,
        filename: `nomzod_${interview.candidate.telegramId}_${interview.id}.pdf`,
      });
    } catch (error) {
      console.error('Error sending notification to HR manager:', error);
    }
  }
}
