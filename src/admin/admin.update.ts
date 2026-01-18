import { Injectable } from '@nestjs/common';
import { Command, Update, Ctx, On, Message } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
@Update()
export class AdminUpdate {
  private creatingVacancy: Map<string, any> = new Map();

  constructor(
    private readonly adminService: AdminService,
    private readonly prisma: PrismaService,
  ) {}

  @Command('admin')
  async adminCommand(@Ctx() ctx: Context) {
    const telegramId = ctx.from.id.toString();

    if (!(await this.adminService.isAdmin(telegramId))) {
      await ctx.reply('❌ Sizda admin huquqi yo\'q.');
      return;
    }

    await ctx.reply(
      '👨‍💼 *Admin Panel*\n\n' +
        'Mavjud buyruqlar:\n' +
        '/create_vacancy - Yangi vakansiya yaratish\n' +
        '/candidates - Nomzodlarni ko\'rish\n' +
        '/top_candidates - Eng yaxshi nomzodlar\n' +
        '/vacancies_list - Barcha vakansiyalar\n' +
        '/stats - Statistika',
      { parse_mode: 'Markdown' },
    );
  }

  @Command('create_vacancy')
  async createVacancyCommand(@Ctx() ctx: Context) {
    const telegramId = ctx.from.id.toString();

    if (!(await this.adminService.isAdmin(telegramId))) {
      await ctx.reply('❌ Sizda admin huquqi yo\'q.');
      return;
    }

    this.creatingVacancy.set(telegramId, {
      step: 'title',
      data: {},
    });

    await ctx.reply(
      '📝 Yangi vakansiya yaratish\n\n' +
        '1. Vakansiya nomini yuboring:',
    );
  }

  @Command('candidates')
  async candidatesCommand(@Ctx() ctx: Context) {
    const telegramId = ctx.from.id.toString();

    if (!(await this.adminService.isAdmin(telegramId))) {
      await ctx.reply('❌ Sizda admin huquqi yo\'q.');
      return;
    }

    const candidates = await this.adminService.getCandidates(10);

    if (candidates.length === 0) {
      await ctx.reply('📭 Hozircha nomzodlar mavjud emas.');
      return;
    }

    let message = '📋 *Nomzodlar ro\'yxati:*\n\n';
    candidates.forEach((interview, index) => {
      message += `${index + 1}. ${interview.candidate.firstName || 'Noma\'lum'} `;
      message += `- ${interview.vacancy.title}\n`;
      message += `   Ball: ${interview.matchScore?.toFixed(1) || 0}%\n`;
      message += `   ID: ${interview.id}\n\n`;
    });

    await ctx.reply(message, { parse_mode: 'Markdown' });
  }

  @Command('top_candidates')
  async topCandidatesCommand(@Ctx() ctx: Context) {
    const telegramId = ctx.from.id.toString();

    if (!(await this.adminService.isAdmin(telegramId))) {
      await ctx.reply('❌ Sizda admin huquqi yo\'q.');
      return;
    }

    const candidates = await this.adminService.getCandidates(5, 70);

    if (candidates.length === 0) {
      await ctx.reply('📭 70% dan yuqori ballga ega nomzodlar mavjud emas.');
      return;
    }

    let message = '⭐ *Eng yaxshi nomzodlar (70%+):*\n\n';
    for (const interview of candidates) {
      message += `👤 ${interview.candidate.firstName || 'Noma\'lum'} ${interview.candidate.lastName || ''}\n`;
      message += `📌 ${interview.vacancy.title}\n`;
      message += `🎯 Ball: ${interview.matchScore?.toFixed(1)}%\n`;
      message += `📄 Hisobot: /report_${interview.id}\n\n`;
    }

    await ctx.reply(message, { parse_mode: 'Markdown' });
  }

  @Command('vacancies_list')
  async vacanciesListCommand(@Ctx() ctx: Context) {
    const telegramId = ctx.from.id.toString();

    if (!(await this.adminService.isAdmin(telegramId))) {
      await ctx.reply('❌ Sizda admin huquqi yo\'q.');
      return;
    }

    const vacancies = await this.prisma.vacancy.findMany({
      orderBy: { createdAt: 'desc' },
    });

    if (vacancies.length === 0) {
      await ctx.reply('📭 Vakansiyalar mavjud emas.');
      return;
    }

    let message = '📋 *Vakansiyalar:*\n\n';
    vacancies.forEach((vacancy, index) => {
      message += `${index + 1}. ${vacancy.title}\n`;
      message += `   Status: ${vacancy.status}\n`;
      message += `   Maosh: ${vacancy.salary || 'Kelishiladi'}\n\n`;
    });

    await ctx.reply(message, { parse_mode: 'Markdown' });
  }

  @Command('stats')
  async statsCommand(@Ctx() ctx: Context) {
    const telegramId = ctx.from.id.toString();

    if (!(await this.adminService.isAdmin(telegramId))) {
      await ctx.reply('❌ Sizda admin huquqi yo\'q.');
      return;
    }

    const [totalCandidates, totalInterviews, completedInterviews, activeVacancies] =
      await Promise.all([
        this.prisma.candidate.count(),
        this.prisma.interview.count(),
        this.prisma.interview.count({ where: { status: 'COMPLETED' } }),
        this.prisma.vacancy.count({ where: { status: 'ACTIVE' } }),
      ]);

    const avgScore = await this.prisma.interview.aggregate({
      where: { status: 'COMPLETED' },
      _avg: { matchScore: true },
    });

    await ctx.reply(
      `📊 *Statistika*\n\n` +
        `👥 Jami nomzodlar: ${totalCandidates}\n` +
        `📝 Jami suhbatlar: ${totalInterviews}\n` +
        `✅ Yakunlangan: ${completedInterviews}\n` +
        `📌 Faol vakansiyalar: ${activeVacancies}\n` +
        `⭐ O'rtacha ball: ${avgScore._avg.matchScore?.toFixed(1) || 0}%`,
      { parse_mode: 'Markdown' },
    );
  }

  @On('text')
  async handleText(@Ctx() ctx: Context, @Message('text') text: string) {
    const telegramId = ctx.from.id.toString();

    if (!(await this.adminService.isAdmin(telegramId))) {
      return;
    }

    const vacancyData = this.creatingVacancy.get(telegramId);
    if (!vacancyData) {
      return;
    }

    if (vacancyData.step === 'title') {
      vacancyData.data.title = text;
      vacancyData.step = 'description';
      await ctx.reply('2. Vakansiya tavsifini yuboring:');
    } else if (vacancyData.step === 'description') {
      vacancyData.data.description = text;
      vacancyData.step = 'requirements';
      await ctx.reply('3. Talablarni yuboring:');
    } else if (vacancyData.step === 'requirements') {
      vacancyData.data.requirements = text;
      vacancyData.step = 'salary';
      await ctx.reply('4. Maoshni yuboring (yoki "Kelishiladi" deb yozing):');
    } else if (vacancyData.step === 'salary') {
      vacancyData.data.salary = text === 'Kelishiladi' ? null : text;
      vacancyData.step = 'questions';
      vacancyData.data.questions = [];
      await ctx.reply(
        '5. Suhbat savollarini yuboring (har bir savol alohida qatorda):\n' +
          'Masalan:\n' +
          'Node.js-da Event Loop qanday ishlaydi?\n' +
          'REST API va GraphQL farqi nima?\n' +
          '...\n\n' +
          'Savollarni yuborib, tugagach /finish_vacancy buyrug\'ini bosing.',
      );
    } else if (vacancyData.step === 'questions') {
      if (text.startsWith('/')) {
        return;
      }
      vacancyData.data.questions.push(text);
      await ctx.reply(
        `✅ Savol qo'shildi (${vacancyData.data.questions.length} ta)\n` +
          'Yana savol qo\'shish yoki /finish_vacancy buyrug\'ini bosing.',
      );
    }
  }

  @Command('finish_vacancy')
  async finishVacancyCommand(@Ctx() ctx: Context) {
    const telegramId = ctx.from.id.toString();

    if (!(await this.adminService.isAdmin(telegramId))) {
      await ctx.reply('❌ Sizda admin huquqi yo\'q.');
      return;
    }

    const vacancyData = this.creatingVacancy.get(telegramId);
    if (!vacancyData || vacancyData.step !== 'questions') {
      await ctx.reply('❌ Vakansiya yaratish jarayoni mavjud emas.');
      return;
    }

    if (vacancyData.data.questions.length === 0) {
      await ctx.reply('❌ Kamida bitta savol bo\'lishi kerak.');
      return;
    }

    try {
      const vacancy = await this.adminService.createVacancy(vacancyData.data);
      this.creatingVacancy.delete(telegramId);

      await ctx.reply(
        `✅ Vakansiya muvaffaqiyatli yaratildi!\n\n` +
          `📌 Nomi: ${vacancy.title}\n` +
          `💰 Maosh: ${vacancy.salary || 'Kelishiladi'}\n` +
          `❓ Savollar: ${vacancyData.data.questions.length} ta`,
      );
    } catch (error) {
      await ctx.reply('❌ Xatolik yuz berdi: ' + error.message);
    }
  }

  @Command(/^report_(.+)$/)
  async reportCommand(@Ctx() ctx: any) {
    const telegramId = ctx.from.id.toString();
    const interviewId = ctx.match[1];

    if (!(await this.adminService.isAdmin(telegramId))) {
      await ctx.reply('❌ Sizda admin huquqi yo\'q.');
      return;
    }

    await ctx.reply('📄 Hisobot tayyorlanmoqda...');

    const pdfBuffer = await this.adminService.getCandidateReport(interviewId);

    if (!pdfBuffer) {
      await ctx.reply('❌ Hisobot topilmadi.');
      return;
    }

    await ctx.replyWithDocument({
      source: pdfBuffer,
      filename: `nomzod_${interviewId}.pdf`,
    });
  }
}
