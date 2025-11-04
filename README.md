# 90-Dagars Challenge

En komplett coaching-plattform för personlig träning och kost, med interaktiva presentationer, verktyg och progress tracking.

## 🎯 Status

### ✅ Implementerat och Klart

#### 🔐 Authentication & Roller
- [x] NextAuth integration med credentials provider
- [x] Login/signup med email och password
- [x] Coach och Client roller
- [x] Route protection baserat på roll
- [x] Setup-account flow för nya användare
- [x] Middleware för route guards

#### 🗄️ Database & Backend
- [x] Prisma ORM setup
- [x] PostgreSQL databas (Railway)
- [x] User, Client, Lead, File modeller
- [x] Lesson, Slide, LessonProgress modeller
- [x] CheckIn modell för daglig tracking
- [x] Fullständiga CRUD API endpoints

#### 📊 Dashboard & Navigation
- [x] Coach dashboard med översikt
- [x] Client dashboard med personlig data
- [x] Responsiv navigation med role-based menu items
- [x] Progress tracking för klienter
- [x] Check-in system med viktgraf (Recharts)

#### 👥 Client Management (Coach)
- [x] Client list med sök och filter
- [x] Individual client profiles
- [x] Client stats och progress
- [x] Invite system (manual add)
- [x] Client onboarding flow

#### 📈 Leads Management (Coach)
- [x] Lead capture från landing page
- [x] Lead list med status tracking
- [x] Konvertera leads till klienter
- [x] Lead notes och comments

#### 📁 Files Management (Coach)
- [x] Upload filer (PDFs, bilder, videos)
- [x] Dela filer med specifika klienter
- [x] File library med kategorier
- [x] Tagging system

#### ✅ Check-In System
- [x] Daglig check-in för klienter
- [x] Viktnedgång tracking
- [x] Energy level och sleep tracking
- [x] Progress graf med vikt över tid
- [x] Check-in history

#### 🎓 Lessons/Presentation System
- [x] **Coach - Lessons List:**
  - Skapa, redigera, ta bort lektioner
  - Filtrera efter fas (1/2/3) och status (publicerad/utkast)
  - Organisera efter fas (Dag 1-30, 31-60, 61-90)
- [x] **Coach - Lesson Editor:**
  - Redigera metadata (titel, beskrivning, fas, omslagsbild)
  - Slide management (lägg till, redigera, ta bort, ordna om)
  - MDX editor med live preview
  - Video embed med YouTube/Vimeo support och preview
  - Quiz editor med svarsalternativ
- [x] **Client - Lessons List:**
  - Lektioner organiserade efter fas
  - Lesson locking baserat på prerequisites
  - Progress tracking (% färdigt, genomförd badge)
  - Omslagsbilder och beskrivningar
- [x] **Client - Slide Viewer:**
  - Fullskärms presentation mode
  - MDX rendering för text-slides
  - Video embeds för videor
  - Interaktiva quiz med feedback
  - Föregående/Nästa navigation
  - Auto-sparar progress
  - "Slutför lektion" funktionalitet

#### 🛠️ Tools (Client)
- [x] **Calorie Calculator:**
  - BMR och TDEE beräkningar
  - Anpassad kaloriplanering
  - Exportera plan
- [x] **Meal Distribution Calculator:**
  - Beräkna protein/carbs/fat per måltid
  - Antal måltider per dag
  - Visual distribution
- [x] **Steps Calculator:**
  - Dagliga stegmål
  - Steg till kalorier konvertering
- [x] **Workspace:**
  - Live preview av alla verktyg samtidigt
  - Real-time uppdatering

#### 🎨 Landing Page
- [x] Hero section med CTA
- [x] Features showcase
- [x] Program benefits
- [x] "Vem passar programmet för?" sektion
- [x] Lead capture form
- [x] Responsiv design

#### 📐 Calculations
- [x] BMR (Basal Metabolic Rate)
- [x] TDEE (Total Daily Energy Expenditure)
- [x] Macro distribution (protein, carbs, fat)
- [x] Steps to calories conversion
- [x] TypeScript typer för alla beräkningar

### 🚧 Möjliga Förbättringar (Optional)

#### Lessons System
- [ ] Drag-and-drop för slide ordering
- [ ] Quiz results tracking (om önskat)
- [ ] Audio support för slides
- [ ] Slide templates
- [ ] Bulk actions för slides

#### Dashboard
- [ ] Calendar view för lektioner och check-ins
- [ ] Notifikationer för nya lektioner
- [ ] Progress badges och achievements

#### Analytics
- [ ] Coach dashboard analytics
- [ ] Client engagement metrics
- [ ] Lesson completion rates

## 🚀 Kom igång

### 1. Installera dependencies
```bash
npm install
```

### 2. Konfigurera miljövariabler
Skapa `.env.local`:
```env
# Database (Railway PostgreSQL)
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="din-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Setup databas
```bash
# Generera Prisma client
npx prisma generate

# Skapa databas schema
npx prisma db push

# (Optional) Öppna Prisma Studio
npx prisma studio
```

### 4. Starta utvecklingsservern
```bash
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000)

### 5. Skapa första coach-användare
1. Gå till `/signup` och skapa konto
2. Använd Prisma Studio eller SQL för att ändra role till "coach":
```sql
UPDATE "User" SET role = 'coach' WHERE email = 'din@email.com';
```

## 📁 Projektstruktur

```
90-days-challenge/
├── app/
│   ├── (auth)/                    # Auth routes
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/               # Dashboard routes
│   │   └── dashboard/
│   │       ├── check-in/          # ✅ Check-in system
│   │       ├── clients/           # ✅ Client management
│   │       ├── leads/             # ✅ Lead management
│   │       ├── content/
│   │       │   ├── files/         # ✅ File management
│   │       │   └── lessons/       # ✅ Lesson management (Coach)
│   │       ├── lessons/           # ✅ Lessons viewer (Client)
│   │       ├── progress/          # ✅ Progress tracking
│   │       ├── profile/           # ✅ User profile
│   │       └── tools/             # ✅ Client tools
│   │           ├── workspace/     # ✅ All tools in one view
│   │           ├── meal-distribution/
│   │           └── steps/
│   ├── (onboarding)/
│   │   ├── step-1/                # ✅ Profile
│   │   ├── step-2/                # ✅ Goals
│   │   ├── step-3/                # ✅ Lifestyle
│   │   ├── step-4/                # ✅ Nutrition
│   │   └── step-5/                # ✅ Summary
│   ├── api/                       # API routes
│   │   ├── auth/
│   │   ├── check-in/
│   │   ├── clients/
│   │   ├── files/
│   │   ├── leads/
│   │   └── lessons/               # ✅ Lessons CRUD + Progress
│   └── page.tsx                   # ✅ Landing page
├── components/
│   ├── ui/                        # shadcn/ui komponenter
│   ├── mdx-preview.tsx            # ✅ MDX rendering
│   ├── quiz.tsx                   # ✅ Interactive quiz
│   └── video-embed.tsx            # ✅ YouTube/Vimeo embed
├── lib/
│   ├── auth.ts                    # ✅ NextAuth config
│   ├── prisma.ts                  # ✅ Prisma client
│   └── calculations/              # ✅ TDEE, macros, etc.
├── prisma/
│   └── schema.prisma              # ✅ Database schema
└── middleware.ts                  # ✅ Auth protection

```

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **Database**: PostgreSQL (Railway)
- **ORM**: Prisma
- **Auth**: NextAuth.js
- **Forms**: react-hook-form + zod
- **Charts**: Recharts
- **Content**: MDX (react-markdown)
- **Video**: YouTube/Vimeo embeds
- **Deployment**: Railway

## 📚 Använda Systemet

### Som Coach
1. **Client Management**: Lägg till och hantera klienter från `/dashboard/clients`
2. **Leads**: Fånga leads från landing page, konvertera till klienter
3. **Files**: Ladda upp och dela filer med klienter
4. **Lessons**: Skapa interaktiva presentationer med MDX, video och quiz
   - Organisera efter fas (1-30, 31-60, 61-90 dagar)
   - Publicera när redo
   - Sätt prerequisites för att låsa lektioner

### Som Client
1. **Dashboard**: Se dagens övergripande status
2. **Check-in**: Logga daglig vikt, energi och sömn
3. **Progress**: Se viktutveckling i graf
4. **Tools**: Använd kaloriräknare, måltidsfördelning, stegräknare
5. **Lessons**: Gå igenom lektioner i din egen takt
   - Följ fas-baserad progression
   - Ta quiz för att testa kunskap
   - Spara progress automatiskt

## 🔧 Utvecklingskommandon

```bash
# Starta dev server
npm run dev

# Bygg projektet
npm run build

# Kör production build
npm start

# Lint
npm run lint

# Prisma
npx prisma studio              # Öppna databas UI
npx prisma generate            # Generera client
npx prisma db push             # Synka schema till databas
npx prisma migrate dev         # Skapa migration

# Lägg till shadcn komponent
npx shadcn@latest add [component-name]
```

## 💡 Tips för Utveckling

### Arbeta med Prisma
```typescript
import { prisma } from '@/lib/prisma'

// Skapa
const user = await prisma.user.create({
  data: { email, name, role: 'client' }
})

// Hämta
const clients = await prisma.user.findMany({
  where: { role: 'client' },
  include: { checkIns: true }
})
```

### Skapa Lessons
```typescript
// 1. Skapa lektion
const lesson = await prisma.lesson.create({
  data: {
    title: 'Introduktion till Nutrition',
    phase: 1,
    orderIndex: 0,
    published: false
  }
})

// 2. Lägg till slides
await prisma.slide.create({
  data: {
    lessonId: lesson.id,
    type: 'MDX_SLIDE',
    title: 'Välkommen',
    content: '# Hej!\n\nDetta är din första lektion.',
    orderIndex: 0
  }
})
```

### Använda MDX Preview
```typescript
import { MDXPreview } from '@/components/mdx-preview'

<MDXPreview content={`
# Rubrik
Detta är **bold** och detta är *italic*.

- Lista item 1
- Lista item 2
`} />
```

## 🎯 Nästa Steg

1. **Skapa innehåll**: Börja skapa lektioner för dina klienter
2. **Anpassa design**: Justera färger och branding i `tailwind.config.ts`
3. **Lägg till features**: Implementera egna tools eller förbättringar
4. **Deploy**: Använd Railway för produktion

## 📖 Dokumentation

- **STATUS.md** - Detaljerad projektstatus
- **Prisma Schema** - Se `prisma/schema.prisma` för databasstruktur
- **API Endpoints** - Se `app/api/` för alla endpoints

## 🤝 Support

Detta är ett personligt projekt. För frågor eller förbättringar, öppna ett issue eller kontakta utvecklaren.

---

**Byggd med ❤️ för att hjälpa coaches att hjälpa sina klienter**
