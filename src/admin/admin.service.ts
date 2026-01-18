import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportService } from '../report/report.service';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf, Context } from 'telegraf';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reportService: ReportService,
    @InjectBot() private readonly bot: Telegraf<Context>,
  ) {}

  async isAdmin(telegramId: string): Promise<boolean> {
    const adminId = process.env.HR_MANAGER_TELEGRAM_ID;
    return adminId === telegramId;
  }

  async createVacancy(data: {
    title: string;
    description: string;
    requirements: string;
    salary?: string;
    questions: string[];
  }) {
    return this.prisma.vacancy.create({
      data: {
        title: data.title,
        description: data.description,
        requirements: data.requirements,
        salary: data.salary,
        questions: data.questions,
        status: 'ACTIVE',
      },
    });
  }

  async getCandidates(limit: number = 10, minScore?: number) {
    const where: any = {
      status: 'COMPLETED',
    };

    if (minScore) {
      where.matchScore = { gte: minScore };
    }

    return this.prisma.interview.findMany({
      where,
      include: {
        candidate: true,
        vacancy: true,
      },
      orderBy: {
        matchScore: 'desc',
      },
      take: limit,
    });
  }

  async getCandidateReport(interviewId: string) {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        candidate: true,
        vacancy: true,
        answers: true,
      },
    });

    if (!interview) {
      return null;
    }

    return this.reportService.generateReport(interview as any);
  }
}
