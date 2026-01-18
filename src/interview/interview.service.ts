import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { NotificationService } from '../notification/notification.service';
import { ReportService } from '../report/report.service';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf, Context } from 'telegraf';

@Injectable()
export class InterviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly notificationService: NotificationService,
    private readonly reportService: ReportService,
    @InjectBot() private readonly bot: Telegraf<Context>,
  ) {}

  async startInterview(chatId: number, vacancyId: string, telegramId: string) {
    // Check if candidate exists
    let candidate = await this.prisma.candidate.findUnique({
      where: { telegramId },
    });

    if (!candidate) {
      candidate = await this.prisma.candidate.create({
        data: { telegramId },
      });
    }

    // Check if there's an active interview
    const activeInterview = await this.prisma.interview.findFirst({
      where: {
        candidateId: candidate.id,
        status: 'IN_PROGRESS',
      },
    });

    if (activeInterview) {
      await this.bot.telegram.sendMessage(
        chatId,
        '⚠️ Sizda allaqachon faol suhbat bor. Avval uni yakunlang.',
      );
      return null;
    }

    // Create new interview
    const interview = await this.prisma.interview.create({
      data: {
        candidateId: candidate.id,
        vacancyId,
        status: 'IN_PROGRESS',
        currentQuestionIndex: 0,
      },
    });

    return interview;
  }

  async getActiveInterview(telegramId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { telegramId },
    });

    if (!candidate) return null;

    return this.prisma.interview.findFirst({
      where: {
        candidateId: candidate.id,
        status: 'IN_PROGRESS',
      },
      include: {
        vacancy: true,
      },
    });
  }

  async sendNextQuestion(chatId: number, interviewId: string) {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
      include: { vacancy: true },
    });

    if (!interview || interview.status !== 'IN_PROGRESS') {
      return;
    }

    const questions = interview.vacancy.questions as string[];
    const currentIndex = interview.currentQuestionIndex;

    if (currentIndex >= questions.length) {
      // Interview completed
      await this.completeInterview(interviewId);
      return;
    }

    const question = questions[currentIndex];

    await this.bot.telegram.sendMessage(
      chatId,
      `❓ Savol ${currentIndex + 1}/${questions.length}:\n\n${question}`,
    );
  }

  async processAnswer(interviewId: string, answer: string, isVoice: boolean) {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
      include: { vacancy: true },
    });

    if (!interview) return;

    const questions = interview.vacancy.questions as string[];
    const currentIndex = interview.currentQuestionIndex;

    if (currentIndex >= questions.length) return;

    const question = questions[currentIndex];

    // Evaluate answer using AI
    const evaluation = await this.aiService.evaluateAnswer(
      question,
      answer,
      interview.vacancy.requirements,
    );

    // Save answer
    await this.prisma.answer.create({
      data: {
        interviewId,
        questionIndex: currentIndex,
        question,
        answer,
        score: evaluation.score,
        feedback: evaluation.feedback,
        isVoice,
      },
    });

    // Update interview
    await this.prisma.interview.update({
      where: { id: interviewId },
      data: {
        currentQuestionIndex: currentIndex + 1,
      },
    });
  }

  async completeInterview(interviewId: string) {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        vacancy: true,
        candidate: true,
        answers: true,
      },
    });

    if (!interview) return;

    // Calculate overall match score
    const averageScore =
      interview.answers.reduce((sum, ans) => sum + (ans.score || 0), 0) /
      interview.answers.length;

    const matchScore = (averageScore / 10) * 100; // Convert 0-10 to 0-100

    // Generate final evaluation
    const finalEvaluation = await this.aiService.generateFinalEvaluation(
      interview.vacancy.requirements,
      interview.answers.map((a) => ({
        question: a.question,
        answer: a.answer,
        score: a.score || 0,
      })),
    );

    // Update interview
    await this.prisma.interview.update({
      where: { id: interviewId },
      data: {
        status: 'COMPLETED',
        matchScore,
        completedAt: new Date(),
      },
    });

    // Send completion message to candidate
    const candidateChatId = parseInt(interview.candidate.telegramId);
    await this.bot.telegram.sendMessage(
      candidateChatId,
      `✅ Suhbat yakunlandi!\n\n` +
        `Ma'lumotlaringiz tahlil qilinmoqda. ` +
        `Tez orada sizga javob beramiz.\n\n` +
        `Rahmat! 🙏`,
    );

    // Generate PDF report
    const pdfBuffer = await this.reportService.generateReport(interview);

    // Notify HR manager
    await this.notificationService.notifyNewCandidate(interview, pdfBuffer);
  }
}
