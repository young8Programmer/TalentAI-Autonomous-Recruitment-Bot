import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Interview, Candidate, Vacancy, Answer } from '@prisma/client';

interface InterviewWithRelations extends Interview {
  candidate: Candidate;
  vacancy: Vacancy;
  answers: Answer[];
}

@Injectable()
export class ReportService {
  async generateReport(interview: InterviewWithRelations): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Header
        doc.fontSize(20).text('TalentAI - Nomzod Hisoboti', { align: 'center' });
        doc.moveDown();

        // Candidate Information
        doc.fontSize(16).text('Nomzod Ma\'lumotlari', { underline: true });
        doc.fontSize(12);
        doc.text(`Ism: ${interview.candidate.firstName || 'Noma\'lum'} ${interview.candidate.lastName || ''}`);
        doc.text(`Telegram ID: ${interview.candidate.telegramId}`);
        doc.text(`Telefon: ${interview.candidate.phoneNumber || 'Kiritilmagan'}`);
        doc.text(`Username: @${interview.candidate.username || 'Noma\'lum'}`);
        doc.moveDown();

        // Vacancy Information
        doc.fontSize(16).text('Vakansiya Ma\'lumotlari', { underline: true });
        doc.fontSize(12);
        doc.text(`Nomi: ${interview.vacancy.title}`);
        doc.text(`Talablar: ${interview.vacancy.description}`);
        doc.text(`Maosh: ${interview.vacancy.salary || 'Kelishiladi'}`);
        doc.moveDown();

        // Match Score
        doc.fontSize(16).text('Moslik Balli', { underline: true });
        doc.fontSize(24).fillColor(interview.matchScore && interview.matchScore >= 70 ? 'green' : interview.matchScore && interview.matchScore >= 50 ? 'orange' : 'red');
        doc.text(`${interview.matchScore?.toFixed(1) || 0}%`, { align: 'center' });
        doc.fillColor('black');
        doc.moveDown();

        // Answers
        doc.fontSize(16).text('Suhbat Javoblari', { underline: true });
        doc.fontSize(12);

        interview.answers.forEach((answer, index) => {
          doc.addPage();
          doc.fontSize(14).text(`Savol ${index + 1}:`, { underline: true });
          doc.fontSize(12).text(answer.question);
          doc.moveDown(0.5);
          doc.text('Javob:', { underline: true });
          doc.text(answer.answer);
          doc.moveDown(0.5);
          doc.text(`Ball: ${answer.score?.toFixed(1) || 0}/10`);
          if (answer.feedback) {
            doc.moveDown(0.5);
            doc.text('Tahlil:', { underline: true });
            doc.text(answer.feedback);
          }
          doc.moveDown();
        });

        // Footer
        doc.fontSize(10).text(
          `Hisobot yaratilgan sana: ${new Date().toLocaleString('uz-UZ')}`,
          { align: 'center' },
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
