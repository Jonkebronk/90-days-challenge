# ⚡ Quick Start - Railway Edition

## 1️⃣ Skapa Railway Database (2 min)

1. **Gå till** https://railway.app
2. **Login** med GitHub
3. **New Project** → **Provision PostgreSQL**
4. **Kopiera** DATABASE_URL från "Connect" tab

## 2️⃣ Konfigurera Project (1 min)

Uppdatera `.env.local`:

```env
DATABASE_URL="postgresql://postgres:xxx@xxx.railway.app:5432/railway"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="din-random-string-minst-32-tecken-lång"
```

## 3️⃣ Setup Database (2 min)

```bash
cd C:\Users\johnn\90-days-challenge

# Generera Prisma Client
npx prisma generate

# Skapa databastabeller
npx prisma migrate dev --name init
```

**✅ Säg "yes" om den frågar om att reseta databasen**

## 4️⃣ Starta App (30 sekunder)

```bash
npm run dev
```

→ Öppna http://localhost:3000

## 5️⃣ Testa!

1. **Gå till** http://localhost:3000/signup
2. **Registrera:**
   - Namn: Test User
   - Email: test@example.com
   - Lösenord: test123
3. **Automatic login** → redirectas till `/onboarding/step-1`
4. **Fyll i** onboarding steg 1-3

---

## 🎉 Klart!

Du har nu:
- ✅ Railway PostgreSQL databas
- ✅ Prisma ORM setup
- ✅ NextAuth.js authentication
- ✅ Fungerade onboarding (steg 1-3)

## Nästa Steg

- Implementera steg 4-8 av onboarding
- Bygg dashboard
- Lägg till meal & workout features

Se **RAILWAY_SETUP.md** för detaljerad guide!
