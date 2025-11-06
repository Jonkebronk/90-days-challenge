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

1. **Gå till** http://localhost:3000
   - Se landing page med countdown och invite-kod sektion
2. **Testa Application Form**
   - Klicka "Ansök nu"
   - Fyll i ansökningsformulär
3. **Eller använd Invite Code**
   - Klicka "Har du invite-kod?"
   - Skapa konto med GOLD-kod (om du har en)
4. **Registrera** (utan invite):
   - Gå till `/signup`
   - Namn: Test User
   - Email: test@example.com
   - Lösenord: test123
5. **Onboarding** → redirectas till `/onboarding/step-1`
   - Fyll i alla 5 steg
6. **Dashboard**
   - Utforska Article Bank, Recipe Bank, Roadmap
   - Testa check-in och tools

---

## 🎉 Klart!

Du har nu:
- ✅ Railway PostgreSQL databas
- ✅ Prisma ORM setup
- ✅ NextAuth.js authentication med invite-kod system
- ✅ Komplett onboarding (5 steg)
- ✅ Article Bank & Recipe Bank
- ✅ 90-Day Roadmap
- ✅ Check-in system
- ✅ Client tools (kaloriräknare, etc.)

## Nästa Steg

1. **Skapa första coach-användaren:**
   - Använd Prisma Studio: `npx prisma studio`
   - Ändra role från "client" till "coach"
2. **Som coach:**
   - Skapa artiklar och recept
   - Bygg 90-dagars roadmap
   - Hantera clients och leads

Se **STATUS.md** för fullständig feature-lista!
