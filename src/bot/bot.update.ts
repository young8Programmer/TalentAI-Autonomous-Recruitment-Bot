import { Injectable } from '@nestjs/common';
import { Update, Ctx, Start, Command, On, Action } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { BotService } from './bot.service';
import { InterviewService } from '../interview/interview.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
@Update()
export class BotUpdate {
  constructor(
    private readonly botService: BotService,
    private readonly interviewService: InterviewService,
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  @Start()
  async startCommand(@Ctx() ctx: Context) {
    const telegramId = ctx.from.id.toString();
    const firstName = ctx.from.first_name || '';
    const lastName = ctx.from.last_name || '';
    const username = ctx.from.username;

    // Create or update candidate
    await this.prisma.candidate.upsert({
      where: { telegramId },
      update: {
        firstName,
        lastName,
        username,
      },
      create: {
        telegramId,
        firstName,
        lastName,
        username,
      },
    });

    await ctx.reply(
      `👋 Salom, ${firstName}! \n\n` +
        `Men TalentAI - avtonom ishga qabul boti. ` +
        `Men sizni vakansiyalar bo'yicha suhbatdan o'tkazaman va AI yordamida baholayman.\n\n` +
        `Boshlash uchun /vacancies buyrug'ini bosing.`,
    );
  }

  @Command('vacancies')
  async showVacancies(@Ctx() ctx: Context) {
    await this.botService.sendVacanciesList(ctx.chat.id);
  }

  @Action(/^vacancy_(.+)$/)
  async handleVacancySelection(@Ctx() ctx: any) {
    const vacancyId = ctx.match[1];
    const telegramId = ctx.from.id.toString();

    await ctx.answerCbQuery('Vakansiya tanlandi, suhbat boshlandi...');

    const interview = await this.interviewService.startInterview(
      ctx.chat.id,
      vacancyId,
      telegramId,
    );

    if (interview) {
      await ctx.reply(
        `✅ Vakansiya tanlandi!\n\n` +
          `Suhbat boshlandi. Iltimos, savollarga to'liq va aniq javob bering.\n\n` +
          `Siz matn yoki ovozli xabar yuborishingiz mumkin.`,
      );
      await this.interviewService.sendNextQuestion(ctx.chat.id, interview.id);
    }
  }

  @On('text')
  async handleTextMessage(@Ctx() ctx: Context) {
    const telegramId = ctx.from.id.toString();
    const text = (ctx.message as any).text;

    // Skip if it's a command
    if (text?.startsWith('/')) {
      return;
    }

    const activeInterview = await this.interviewService.getActiveInterview(telegramId);

    if (!activeInterview) {
      // Don't reply if user might be in admin mode
      return;
    }

    await this.interviewService.processAnswer(activeInterview.id, text, false);
    await this.interviewService.sendNextQuestion(ctx.chat.id, activeInterview.id);
  }

  @On('voice')
  async handleVoiceMessage(@Ctx() ctx: Context) {
    const telegramId = ctx.from.id.toString();
    const voice = (ctx.message as any).voice;

    const activeInterview = await this.interviewService.getActiveInterview(telegramId);

    if (!activeInterview) {
      await ctx.reply(
        'Suhbat mavjud emas. Yangi suhbatni boshlash uchun /vacancies buyrug\'ini bosing.',
      );
      return;
    }

    await ctx.reply('🎤 Ovozli xabaringiz qayta ishlanmoqda...');

    // Download and transcribe voice
    const transcribedText = await this.aiService.transcribeVoice(
      voice.file_id,
      ctx.telegram,
    );

    if (transcribedText) {
      await ctx.reply(`📝 Transkripsiya: ${transcribedText}`);
      await this.interviewService.processAnswer(activeInterview.id, transcribedText, true);
      await this.interviewService.sendNextQuestion(ctx.chat.id, activeInterview.id);
    } else {
      await ctx.reply('❌ Ovozli xabarni tushunib bo\'lmadi. Iltimos, qayta yuboring.');
    }
  }
}
