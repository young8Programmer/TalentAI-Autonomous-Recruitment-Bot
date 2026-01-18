# TalentAI: Autonomous Recruitment Bot

<div align="center">

🤖 **Professional AI-powered autonomous recruitment bot for Telegram**

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

Bu loyiha NestJS, OpenAI GPT-4o, Telegram Bot API, PostgreSQL va Redis texnologiyalaridan foydalangan holda yaratilgan professional darajadagi ishga qabul boti.

## 🎯 Loyiha Xususiyatlari

### Nomzodlar uchun:
- ✅ Faol vakansiyalarni ko'rish
- ✅ Interaktiv suhbatdan o'tish
- ✅ Matn yoki ovozli javob berish (Whisper API)
- ✅ AI tomonidan avtomatik baholash
- ✅ Real-time suhbat jarayoni

### HR-Menejerlar uchun:
- ✅ Vakansiya yaratish (talablar, maosh, savollar)
- ✅ Nomzodlarning Match Score reytingini ko'rish
- ✅ Eng yaxshi nomzodlarni filtrlash
- ✅ PDF rezume yuklab olish
- ✅ To'liq statistika

## 🛠️ Texnologiyalar

- **Backend Framework**: NestJS 10
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis
- **AI/ML**: OpenAI GPT-4o + Whisper API
- **Bot Framework**: Telegraf (nestjs-telegraf)
- **PDF Generation**: PDFKit
- **Containerization**: Docker & Docker Compose

## 📋 Talablar

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+
- OpenAI API Key
- Telegram Bot Token

## 🚀 O'rnatish

### 1. Repository ni klonlash

```bash
git clone <repository-url>
cd talentai-autonomous-recruitment-bot
```

### 2. Environment variables ni sozlash

`.env` faylini yarating va quyidagi ma'lumotlarni to'ldiring:

```env
# Database
DATABASE_URL="postgresql://talentai:talentai123@localhost:5432/talentai?schema=public"

# Telegram Bot
TELEGRAM_BOT_TOKEN="your_telegram_bot_token_here"

# OpenAI
OPENAI_API_KEY="your_openai_api_key_here"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Application
NODE_ENV=development
PORT=3000

# HR Manager Telegram ID (for notifications)
HR_MANAGER_TELEGRAM_ID="your_hr_manager_telegram_id"
```

### 3. Dependencies ni o'rnatish

```bash
npm install
```

### 4. Database ni sozlash

```bash
# Prisma client generate qilish
npm run prisma:generate

# Migration qilish
npm run prisma:migrate
```

### 5. Docker orqali ishga tushirish

```bash
# Barcha servislarni ishga tushirish (PostgreSQL, Redis, App)
docker-compose up -d

# Loglarni ko'rish
docker-compose logs -f app
```

### 6. Yoki lokal ishga tushirish

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## 📱 Foydalanish

### Nomzodlar uchun:

1. Telegram'da botni toping va `/start` buyrug'ini bosing
2. `/vacancies` buyrug'i orqali mavjud vakansiyalarni ko'ring
3. Vakansiyani tanlang va suhbatni boshlang
4. Savollarga javob bering (matn yoki ovozli)
5. Suhbat yakunlanganda AI tahlil qiladi va natijalarni HR-ga yuboradi

### HR-Menejerlar uchun:

1. Botga `/admin` buyrug'ini yuboring
2. Vakansiya yaratish: `/create_vacancy`
3. Nomzodlarni ko'rish: `/candidates`
4. Eng yaxshi nomzodlar: `/top_candidates`
5. PDF hisobot: `/report_<interview_id>`
6. Statistika: `/stats`

## 🏗️ Arxitektura

```
src/
├── admin/          # Admin panel (HR menejerlar uchun)
├── ai/             # OpenAI integratsiyasi (GPT-4o, Whisper)
├── bot/            # Telegram bot logikasi
├── interview/      # Suhbat jarayonini boshqarish
├── notification/   # HR-ga bildirishnomalar
├── prisma/         # Database service
└── report/         # PDF hisobot generatsiyasi
```

## 📊 Database Schema

- **Vacancies**: Vakansiyalar (nomi, talablar, savollar)
- **Candidates**: Nomzodlar (Telegram ID, ism, telefon)
- **Interviews**: Suhbatlar (status, match score)
- **Answers**: Javoblar (savol, javob, AI balli)

## 🔧 Development

```bash
# Code formatting
npm run format

# Linting
npm run lint

# Testing
npm run test

# Prisma Studio (Database GUI)
npm run prisma:studio
```

## 🐳 Docker

```bash
# Barcha servislarni ishga tushirish
docker-compose up -d

# To'xtatish
docker-compose down

# Loglarni ko'rish
docker-compose logs -f

# Database'ni tozalash
docker-compose down -v
```

## 📝 API Endpoints

Loyiha asosan Telegram Bot API orqali ishlaydi. Agar REST API kerak bo'lsa, qo'shimcha modullar qo'shish mumkin.

## 🤝 Contributing

1. Fork qiling
2. Feature branch yarating (`git checkout -b feature/amazing-feature`)
3. Commit qiling (`git commit -m 'Add amazing feature'`)
4. Push qiling (`git push origin feature/amazing-feature`)
5. Pull Request yarating

## 📄 License

MIT License

## 👨‍💻 Author

TalentAI Development Team

## 🙏 Acknowledgments

- OpenAI for GPT-4o and Whisper API
- NestJS team for the amazing framework
- Telegram for Bot API

---

**Note**: Bu loyiha portfolio va o'qish maqsadida yaratilgan. Production'da ishlatishdan oldin security va performance optimizatsiyalarini qo'shing.
