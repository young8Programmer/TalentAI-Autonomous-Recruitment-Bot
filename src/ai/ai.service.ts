import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Telegraf } from 'telegraf';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async transcribeVoice(fileId: string, telegram: Telegraf['telegram']): Promise<string | null> {
    let tempFilePath: string | null = null;
    try {
      // Download file from Telegram
      const file = await telegram.getFile(fileId);
      const fileUrl = `https://api.telegram.org/file/bot${this.configService.get<string>('TELEGRAM_BOT_TOKEN')}/${file.file_path}`;

      // Fetch audio file
      const response = await fetch(fileUrl);
      const audioBuffer = Buffer.from(await response.arrayBuffer());

      // Save to temporary file
      tempFilePath = path.join(os.tmpdir(), `voice_${Date.now()}.ogg`);
      fs.writeFileSync(tempFilePath, audioBuffer);

      // Create a File object for OpenAI (using the file path as ReadStream)
      const fileStream = fs.createReadStream(tempFilePath);

      // Transcribe using Whisper
      const transcription = await this.openai.audio.transcriptions.create({
        file: fileStream as any,
        model: 'whisper-1',
        language: 'uz', // Uzbek language
      });

      return transcription.text;
    } catch (error) {
      console.error('Error transcribing voice:', error);
      return null;
    } finally {
      // Clean up temporary file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (error) {
          console.error('Error deleting temp file:', error);
        }
      }
    }
  }

  async evaluateAnswer(
    question: string,
    answer: string,
    requirements: string,
  ): Promise<{ score: number; feedback: string }> {
    try {
      const prompt = `
Siz professional IT recruiter ekansiz. Nomzodning javobini baholang.

Savol: ${question}
Nomzodning javobi: ${answer}
Vakansiya talablari: ${requirements}

Quyidagi formatda javob bering (faqat JSON):
{
  "score": 0-10 orasidagi ball (butun son),
  "feedback": "Qisqa tahlil va xatolar (agar bor bo'lsa)"
}

Javob faqat JSON bo'lishi kerak, boshqa matn bo'lmasin.
`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'Siz professional IT recruiter ekansiz. Nomzodlarning javoblarini aniq va adolatli baholaysiz. Faqat JSON formatida javob berasiz.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      return {
        score: result.score || 0,
        feedback: result.feedback || 'Tahlil mavjud emas',
      };
    } catch (error) {
      console.error('Error evaluating answer:', error);
      return {
        score: 0,
        feedback: 'Baholashda xatolik yuz berdi',
      };
    }
  }

  async generateFinalEvaluation(
    requirements: string,
    answers: Array<{ question: string; answer: string; score: number }>,
  ): Promise<string> {
    try {
      const answersText = answers
        .map((a, i) => `${i + 1}. ${a.question}\nJavob: ${a.answer}\nBall: ${a.score}/10`)
        .join('\n\n');

      const prompt = `
Quyidagi nomzodning suhbat natijalarini tahlil qiling:

Vakansiya talablari: ${requirements}

Nomzodning javoblari:
${answersText}

Umumiy tahlil va tavsiyalarni bering (qisqa va aniq).
`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'Siz professional HR menejer ekansiz. Nomzodlarni to\'liq tahlil qilasiz va aniq tavsiyalar berasiz.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
      });

      return completion.choices[0].message.content || 'Tahlil mavjud emas';
    } catch (error) {
      console.error('Error generating final evaluation:', error);
      return 'Tahlil yaratishda xatolik yuz berdi';
    }
  }
}
