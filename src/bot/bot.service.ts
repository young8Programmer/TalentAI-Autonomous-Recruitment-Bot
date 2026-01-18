import { Injectable } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf, Context } from 'telegraf';
import { PrismaService } from '../prisma/prisma.service';
import { InterviewService } from '../interview/interview.service';

@Injectable()
export class BotService {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly prisma: PrismaService,
    private readonly interviewService: InterviewService,
  ) {}

  async sendMessage(chatId: number, text: string, options?: any) {
    return this.bot.telegram.sendMessage(chatId, text, options);
  }

  async sendVacanciesList(chatId: number) {
    const vacancies = await this.prisma.vacancy.findMany({
      where: { status: 'ACTIVE' },
    });

    if (vacancies.length === 0) {
      return this.sendMessage(
        chatId,
        '😔 Hozircha faol vakansiyalar mavjud emas. Keyinroq qayta urinib ko\'ring.',
      );
    }

    const buttons = vacancies.map((vacancy) => [
      {
        text: `${vacancy.title} - ${vacancy.salary || 'Maosh kelishiladi'}`,
        callback_data: `vacancy_${vacancy.id}`,
      },
    ]);

    return this.sendMessage(chatId, '📋 Mavjud vakansiyalar:', {
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  }

  async startInterview(chatId: number, vacancyId: string, telegramId: string) {
    return this.interviewService.startInterview(chatId, vacancyId, telegramId);
  }
}
