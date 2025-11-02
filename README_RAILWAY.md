# 90-Dagars Challenge - Railway Edition 🚂

**Updated:** Migrerat från Supabase till Railway + Prisma + NextAuth.js

## ✅ Vad som är klart

### Core Setup
- [x] Next.js 15 med TypeScript
- [x] Tailwind CSS + shadcn/ui
- [x] Railway PostgreSQL integration
- [x] Prisma ORM konfigurerad
- [x] NextAuth.js authentication
- [x] Middleware för route protection

### Database
- [x] Prisma schema (alla tabeller definierade)
- [x] User authentication models
- [x] All app-specifik data (profiles, meals, workouts, etc.)

### Authentication
- [x] NextAuth.js setup
- [x] Credentials provider (email/password)
- [x] Registration API route
- [x] Login page (uppdaterad för NextAuth)
- [x] Signup page (uppdaterad för NextAuth)
- [x] Session management

### Onboarding
- [x] Steg 1: Profil
- [x] Steg 2: Mål
- [x] Steg 3: Livsstil

### Calculations
- [x] TDEE beräkningar
- [x] Macro beräkningar

## 🚀 Kom Igång

### 1. Setup Railway Database (5 min)

Se **RAILWAY_SETUP.md** för detaljerad guide!

**Snabbversion:**
1. Gå till https://railway.app
2. Skapa nytt projekt → Provision PostgreSQL
3. Kopiera DATABASE_URL

### 2. Konfigurera Environment Variables

Uppdatera `.env.local`:
```env
DATABASE_URL="postgresql://..."

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="[generera med: openssl rand -base64 32]"
```

### 3. Setup Database

```bash
# Generera Prisma Client
npx prisma generate

# Kör migrations
npx prisma migrate dev --name init

# (Optional) Seed data
npx prisma db seed
```

### 4. Starta Applikationen

```bash
npm run dev
```

Öppna http://localhost:3000

## 📁 Projektstruktur

```
90-days-challenge/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── [...nextauth]/route.ts  # NextAuth API
│   │       └── register/route.ts        # Registration
│   ├── (auth)/
│   │   ├── login/                       # ✅ NextAuth login
│   │   └── signup/                      # ✅ NextAuth signup
│   ├── (onboarding)/
│   │   ├── step-1/                      # ✅ Profile
│   │   ├── step-2/                      # ✅ Goals
│   │   └── step-3/                      # ✅ Lifestyle
│   └── (dashboard)/                     # 🚧 TODO
├── lib/
│   ├── prisma.ts                        # ✅ Prisma client
│   ├── auth.ts                          # ✅ NextAuth config
│   ├── calculations/                    # ✅ TDEE & macros
│   └── types/                           # ✅ TypeScript types
├── prisma/
│   └── schema.prisma                    # ✅ Database schema
└── middleware.ts                        # ✅ NextAuth middleware
```

## 🔄 Migration från Supabase

### Vad som ändrats:

**Före (Supabase):**
- `@supabase/ssr`
- `lib/supabase/client.ts` + `server.ts`
- Supabase Auth

**Efter (Railway):**
- Prisma ORM
- `lib/prisma.ts`
- NextAuth.js

### Database Skillnader:

| Supabase | Railway + Prisma |
|----------|------------------|
| UUID (default) | CUID (default) |
| snake_case | camelCase |
| RLS policies | Application-level auth |
| Realtime subs | Standard SQL queries |

## 📝 Nästa Steg

### Omedelbart:
1. [ ] Implementera onboarding steg 4-8
2. [ ] Bygg dashboard
3. [ ] Uppdatera onboarding för att spara till Prisma

### Features att bygga:
- [ ] Meal builder & logging
- [ ] Workout builder & logging
- [ ] Daily check-in
- [ ] Progress dashboard
- [ ] Knowledge modules

## 🔧 Användbara Kommandon

```bash
# Prisma
npx prisma studio           # GUI för databas
npx prisma generate         # Generera client
npx prisma migrate dev      # Skapa migration
npx prisma db push          # Push schema (dev)
npx prisma db seed          # Seed database

# Development
npm run dev                 # Start dev server
npm run build               # Build for production
npm start                   # Run production build
```

## 📚 Dokumentation

- **RAILWAY_SETUP.md** - Komplett Railway setup guide
- **COMPLETE_DOCUMENTATION.md** - Original spec (i Downloads)
- **STATUS.md** - Detaljerad status

## 🔗 Externa Resurser

- [Railway Docs](https://docs.railway.app)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth.js Docs](https://next-auth.js.org)
- [shadcn/ui](https://ui.shadcn.com)

## 💡 Tips

### Använd Prisma Studio för att se data:
```bash
npx prisma studio
```

### Debug authentication:
```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const session = await getServerSession(authOptions)
console.log(session)
```

### Query med Prisma:
```typescript
import { prisma } from '@/lib/prisma'

const users = await prisma.user.findMany()
const user = await prisma.user.findUnique({
  where: { email: 'test@example.com' },
  include: { userProfile: true }
})
```

## 🐛 Troubleshooting

### "Environment variable not found: DATABASE_URL"
→ Kontrollera `.env.local` och restarta dev-servern

### "PrismaClient is unable to connect"
→ Verifiera DATABASE_URL från Railway

### "Error: Adapter is not assignable"
→ Det är en TypeScript varning, kan ignoreras eller fixa med `as any`

### Middleware error
→ Säkerställ att NEXTAUTH_SECRET är satt

## 🚂 Deployment på Railway

När du är redo:

1. Push till GitHub
2. Railway Dashboard → New → GitHub Repo
3. Välj repo
4. Sätt environment variables:
   - `DATABASE_URL` (auto från PostgreSQL)
   - `NEXTAUTH_URL` (din production URL)
   - `NEXTAUTH_SECRET` (samma som lokalt)
5. Deploy! 🎉

---

**Uppdaterad:** Nu med Railway + Prisma + NextAuth! 🚀
