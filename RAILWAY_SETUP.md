# 🚂 Railway Setup Guide - 90-Dagars Challenge

## Steg 1: Skapa Railway Account (2 min)

1. Gå till https://railway.app
2. Klicka på "Login" / "Start a New Project"
3. Logga in med GitHub (rekommenderat)

## Steg 2: Skapa PostgreSQL Database (3 min)

1. **Skapa nytt projekt**
   - Klicka "+ New Project"
   - Välj "Provision PostgreSQL"
   - Vänta medan databasen skapas (~30 sekunder)

2. **Kopiera DATABASE_URL**
   - Klicka på PostgreSQL-kortet
   - Gå till "Connect" tab
   - Kopiera "Postgres Connection URL"
   - Det ser ut ungefär så här:
     ```
     postgresql://postgres:password@region.railway.app:5432/railway
     ```

3. **Uppdatera .env.local**
   ```env
   DATABASE_URL="postgresql://postgres:password@region.railway.app:5432/railway"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="din-secret-här"
   ```

4. **Generera NEXTAUTH_SECRET**
   ```bash
   # Windows PowerShell
   [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((1..32 | ForEach-Object { [char](Get-Random -Minimum 65 -Maximum 122) }) -join ''))

   # Eller använd vilken random string som helst (minst 32 tecken)
   ```

## Steg 3: Kör Prisma Migrations (2 min)

```bash
cd C:\Users\johnn\90-days-challenge

# Generera Prisma Client
npx prisma generate

# Skapa databastabeller
npx prisma migrate dev --name init

# Om prompt frågar om att reseta databasen, svara "yes"
```

Detta kommer att:
- ✅ Skapa alla tabeller i Railway PostgreSQL
- ✅ Generera Prisma Client för TypeScript
- ✅ Skapa migration-filer

## Steg 4: (Optional) Seed Database (2 min)

Skapa en seed-fil för test-data:

```bash
# Skapa seed script
# (instruktioner nedan)
```

**prisma/seed.ts**:
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Seed food items
  await prisma.foodItem.createMany({
    data: [
      {
        name: 'Kycklingfilé',
        category: 'protein',
        calories: 165,
        proteinG: 31,
        carbsG: 0,
        fatG: 3.6,
        commonServingSize: '100g',
        isVegetarian: false,
      },
      {
        name: 'Havregryn',
        category: 'carbs',
        calories: 389,
        proteinG: 17,
        carbsG: 66,
        fatG: 7,
        commonServingSize: '1 dl (35g)',
      },
      {
        name: 'Broccoli',
        category: 'vegetables',
        calories: 34,
        proteinG: 2.8,
        carbsG: 7,
        fatG: 0.4,
        commonServingSize: '100g',
      },
    ],
  })

  // Seed exercises
  await prisma.exercise.createMany({
    data: [
      {
        name: 'Armhävningar',
        category: 'push',
        equipmentNeeded: ['bodyweight'],
        difficultyLevel: 'beginner',
        instructions: ['Plankposition', 'Sänk bröstet', 'Pressa upp'],
      },
      {
        name: 'Knäböj',
        category: 'legs',
        equipmentNeeded: ['bodyweight'],
        difficultyLevel: 'beginner',
        instructions: ['Fötter i höftbredd', 'Böj i knä och höft', 'Pressa upp'],
      },
    ],
  })

  console.log('✅ Database seeded!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

Lägg till i **package.json**:
```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

Installera tsx:
```bash
npm install -D tsx
```

Kör seed:
```bash
npx prisma db seed
```

## Steg 5: Testa Applikationen (3 min)

```bash
npm run dev
```

1. **Gå till http://localhost:3000/signup**
2. Registrera en ny användare:
   - Namn: Test User
   - Email: test@example.com
   - Lösenord: test123

3. **Logga in**
   - Använd samma credentials

4. **Testa onboarding**
   - Du redirectas till `/onboarding/step-1`
   - Fyll i formulären

## Verifiering

### Kontrollera att databasen fungerar

**Railway Dashboard**:
1. Gå till ditt Railway-projekt
2. Klicka på PostgreSQL
3. Gå till "Data" tab
4. Du ska se alla tabeller (users, accounts, user_profiles, etc.)

### Prisma Studio (GUI)

```bash
npx prisma studio
```

- Öppnar http://localhost:5555
- Du kan se och redigera data direkt
- Bra för debugging

## Troubleshooting

### Problem: "Environment variable not found: DATABASE_URL"
**Lösning**:
- Kontrollera att `.env.local` har rätt DATABASE_URL
- Restarta dev-servern

### Problem: "Can't reach database server"
**Lösning**:
- Verifiera att DATABASE_URL är korrekt kopierad från Railway
- Kontrollera internet-anslutning
- Railway-databas kan ta 30 sekunder att starta första gången

### Problem: "Prisma Client not generated"
**Lösning**:
```bash
npx prisma generate
```

### Problem: "Migration failed"
**Lösning**:
```bash
# Reseta databasen (VARNING: tar bort all data)
npx prisma migrate reset

# Kör migrations igen
npx prisma migrate dev
```

## Nästa Steg

✅ Nu är Railway setup klar!

Du kan fortsätta med:
1. Uppdatera auth-pages för NextAuth
2. Testa signup/login flödet
3. Fortsätt med onboarding-implementation

## Railway Tips

### Gratis Tier Limits
- 500 timmar/månad compute
- 1GB databas storage
- 100GB utgående data

**Tips**: Mer än tillräckligt för utveckling!

### Deployment till Production
När du är redo att deploya:

1. **Push till GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push
   ```

2. **Connect Railway till GitHub**
   - I Railway Dashboard: "+ New" → "GitHub Repo"
   - Välj ditt repo
   - Railway auto-detectar Next.js och deployer

3. **Sätt Environment Variables**
   - Gå till projekt-inställningar
   - Lägg till:
     - `DATABASE_URL` (auto från PostgreSQL service)
     - `NEXTAUTH_URL` (din production URL)
     - `NEXTAUTH_SECRET` (samma som lokalt)

4. **Deploy**
   - Varje push till main deployer automatiskt!

## Support

- Railway Docs: https://docs.railway.app
- Prisma Docs: https://www.prisma.io/docs
- NextAuth Docs: https://next-auth.js.org

Lycka till! 🚂
