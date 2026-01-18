# TalentAI - O'rnatish va Ishlatish Qo'llanmasi

## 🚀 Tezkor Boshlash

### 1. Dependencies o'rnatish

```bash
npm install
```

### 2. Environment Variables sozlash

`.env` faylini yarating va quyidagi ma'lumotlarni to'ldiring:

```env
DATABASE_URL="postgresql://talentai:talentai123@localhost:5432/talentai?schema=public"
TELEGRAM_BOT_TOKEN="your_bot_token"
OPENAI_API_KEY="your_openai_key"
REDIS_HOST=localhost
REDIS_PORT=6379
HR_MANAGER_TELEGRAM_ID="your_telegram_id"
```

### 3. Database sozlash

```bash
# Prisma client generate qilish
npm run prisma:generate

# Migration qilish
npm run prisma:migrate
```

### 4. Docker orqali ishga tushirish

```bash
docker-compose up -d
```

### 5. Yoki lokal ishga tushirish

```bash
# Development
npm run start:dev
```

## 📝 Telegram Bot Token olish

1. [@BotFather](https://t.me/botfather) ga o'ting
2. `/newbot` buyrug'ini yuboring
3. Bot nomini va username ni kiriting
4. Berilgan token ni `.env` fayliga qo'ying

## 🔑 OpenAI API Key olish

1. [OpenAI Platform](https://platform.openai.com/) ga kiring
2. API Keys bo'limiga o'ting
3. Yangi key yarating
4. Key ni `.env` fayliga qo'ying

## 👨‍💼 Admin Panel

HR menejer sifatida botga `/admin` buyrug'ini yuboring va quyidagi imkoniyatlardan foydalaning:

- `/create_vacancy` - Vakansiya yaratish
- `/candidates` - Barcha nomzodlarni ko'rish
- `/top_candidates` - Eng yaxshi nomzodlar (70%+)
- `/vacancies_list` - Barcha vakansiyalar
- `/stats` - Statistika
- `/report_<interview_id>` - PDF hisobot yuklab olish

## 🐛 Muammolarni hal qilish

### Prisma xatosi

Agar `Property 'candidate' does not exist` xatosi ko'rsatilsa:

```bash
npm run prisma:generate
```

### Redis ulanish xatosi

Docker ishlamayotgan bo'lsa:

```bash
docker-compose up -d redis
```

### Database ulanish xatosi

PostgreSQL ishlamayotgan bo'lsa:

```bash
docker-compose up -d postgres
```

## 📚 Qo'shimcha Ma'lumot

Batafsil ma'lumot uchun [README.md](README.md) faylini ko'ring.
