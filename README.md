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
- [x] Veckovis check-in för klienter
- [x] Vikttracking med progress-foton (fram/sida/bak)
- [x] Energy level, mood, och sleep tracking
- [x] Diet och workout adherence ratings
- [x] Dagliga steg och statusuppdateringar
- [x] Check-in history för coach

#### ✅ Weight Tracker
- [x] Separat vikttracking-verktyg
- [x] Graf över viktutveckling
- [x] Trendanalys över tid

#### 📚 Kunskapsbanken (Article Bank)
- [x] **Article Management (Coach):**
  - Skapa, redigera, ta bort artiklar
  - MDX-stöd för rich content
  - Artikelkategorier med sektioner
  - Publiceringsflöde (draft/published)
  - Fas-tilldelning (1/2/3)
  - Svårighetsgrader
  - Omslagsbilder och lästidsberäkning
- [x] **Article Reader (Client):**
  - Artiklar organiserade efter kategori och sektion
  - Läst/oläst status tracking
  - Progress tracking per kategori
  - Expanderbara kategorikort
  - Responsiv artikelläsare

#### 🍳 Receptbanken (Recipe Bank)
- [x] **Recipe Management (Coach):**
  - Skapa, redigera, ta bort recept
  - Receptkategorier
  - Ingredienser med portioner
  - Steg-för-steg instruktioner
  - Näringsberäkning
  - Svårighetsgrader och dietary tags
  - Måltidstyp-klassificering
- [x] **Recipe Browser (Client):**
  - Recept efter kategori
  - Måltidstyp-filtrering
  - Svårighetsfiltrering
  - Favoritmarkering
  - Näringsinfo och tillagningstid

#### 📅 90-Dagars Roadmap
- [x] **Roadmap Management (Coach):**
  - Tilldela artiklar till specifika dagar (1-90)
  - Sätt prerequisites för progression
  - Fas-baserad organisation
- [x] **Roadmap View (Client):**
  - Dag-för-dag artikeltilldelningar
  - Progress tracking
  - Prerequisites enforcement

#### 🎫 Application & Invite System
- [x] Ansökningsformulär från landing page
- [x] Omfattande lead-capture
  - Nuvarande foton upload
  - Kundavtal-sektion
  - Livsstilsfrågor
- [x] Invite-kod system
  - GOLD-kod format (GOLD-XXXX-XXXX-XXXX)
  - Exklusiv invite-sektion på landing page
  - Kodverifiering och utgångsdatum
  - Lead-to-client konvertering

#### 🎓 Lessons/Presentation System (Legacy)
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

#### 💪 Workout Program System
- [x] **Complete 6-Program System:**
  - Fas 1 (BEGINNER): Första fasen - fokus underkropp & överkropp
    - 3-4 set × 12-15 reps, 75s vila
    - 5 dagar (underkropp) / 4 dagar (överkropp)
  - Fas 2 (INTERMEDIATE): Andra fasen - fokus underkropp & överkropp
    - 4-5 set × 9-12 reps, 60s vila
    - Dropsets introducerade
  - Fas 3 (ADVANCED): Tredje fasen - fokus underkropp & överkropp
    - 3-5 set × 9-12 reps, 60s vila
    - Avancerade tekniker: Compound Sets, Rest-Pause Sets, Dropsets
- [x] **Exercise Database:**
  - 41 övningar med svenska namn
  - Muskelgruppsindelning
  - Utrustningskrav
  - Alla övningar återanvändbara mellan program
- [x] **Program Features:**
  - Mallbaserade program (isTemplate: true)
  - Coach kan tilldela program till klienter
  - Fleradagars träningspass
  - Progressiva svårighetsgrader
  - Intensitetsteknik-spårning
  - Publicera/avpublicera status

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
- [x] **Hero Section:**
  - Titel: "90 DAGARS UTMANINGEN"
  - Animated particle effects med gold accents
  - Shimmer dividers
- [x] **"Hur det fungerar" Section:**
  - 3-stegs process (vertikalt staplade kort)
  - Large transparent background numbers
  - Glass-morphism design med gold borders
  - Steg 1: Ansök och berätta om dina mål
  - Steg 2: Vi går igenom din plan tillsammans
  - Steg 3: Säg ja till utmaningen
- [x] **Program Section:**
  - "Passar för dig" / "Passar INTE" comparison
  - Countdown timer
  - CTA: "Ansök Nu"
- [x] **FAQ Section:**
  - Expandable accordion med 7 frågor
- [x] **Invite Code Section:**
  - Exclusive GOLD-code entry
- [x] **Application Form:**
  - Multi-step comprehensive form
  - Photo uploads (required)
- [x] PWA support & responsiv design

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
│   │   ├── signup/
│   │   ├── apply/                 # ✅ Application form
│   │   └── setup-account/         # ✅ Invite code setup
│   ├── (dashboard)/               # Dashboard routes
│   │   └── dashboard/
│   │       ├── check-in/          # ✅ Check-in system
│   │       ├── clients/           # ✅ Client management
│   │       ├── leads/             # ✅ Lead management
│   │       ├── content/           # ✅ Content creation (Coach only)
│   │       │   ├── articles/      # ✅ Article CRUD
│   │       │   ├── categories/    # ✅ Article category management
│   │       │   ├── recipes/       # ✅ Recipe CRUD
│   │       │   ├── recipe-categories/
│   │       │   ├── files/         # ✅ File management
│   │       │   ├── lessons/       # ✅ Lesson management
│   │       │   └── roadmap/       # ✅ 90-day roadmap assignments
│   │       ├── articles/          # ✅ Article bank (read-only)
│   │       ├── recipes/           # ✅ Recipe bank
│   │       ├── roadmap/           # ✅ 90-day roadmap (Client)
│   │       ├── lessons/           # ✅ Lessons viewer (Client)
│   │       ├── progress/          # ✅ Progress tracking
│   │       ├── weight-tracker/    # ✅ Weight tracking
│   │       ├── profile/           # ✅ User profile
│   │       └── tools/             # ✅ Client tools
│   │           ├── workspace/     # ✅ Coach workspace
│   │           ├── meal-distribution/
│   │           └── steps/
│   ├── (onboarding)/
│   │   ├── step-1/                # ✅ Profile
│   │   ├── step-2/                # ✅ Goals
│   │   ├── step-3/                # ✅ Lifestyle
│   │   ├── step-4/                # ✅ Nutrition
│   │   └── step-5/                # ✅ Summary
│   ├── api/                       # API routes (38 endpoints)
│   │   ├── auth/                  # NextAuth endpoints
│   │   ├── check-in/
│   │   ├── clients/
│   │   ├── leads/
│   │   ├── articles/              # ✅ Article CRUD + progress
│   │   ├── article-categories/
│   │   ├── recipes/               # ✅ Recipe CRUD + favorites
│   │   ├── recipe-categories/
│   │   ├── lessons/               # ✅ Lessons CRUD + Progress
│   │   ├── roadmap/               # ✅ Roadmap assignments
│   │   ├── files/
│   │   ├── calorie-plan/
│   │   ├── onboarding/
│   │   ├── apply/                 # ✅ Application submissions
│   │   ├── verify-invite-code/    # ✅ Invite code verification
│   │   └── admin/
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
   - Generera invite-koder (GOLD-format)
   - Se client check-ins och progress
2. **Leads**: Fånga leads från landing page/application form, konvertera till klienter
3. **Kunskapsbanken**: Skapa och hantera artiklar
   - Organisera i kategorier med sektioner
   - MDX-stöd för rich content
   - Sätt fas och svårighetsgrad
4. **Receptbanken**: Skapa och dela recept
   - Lägg till ingredienser och instruktioner
   - Beräkna näringsvärden automatiskt
5. **90-Dagars Roadmap**: Tilldela artiklar till specifika dagar (1-90)
6. **Files**: Ladda upp och dela filer med klienter
7. **Lessons** (Legacy): Skapa interaktiva presentationer med MDX, video och quiz
8. **Workspace**: Använd coach-verktyg för att skapa client-planer

### Som Client
1. **Dashboard**: Se dagens övergripande status och nästa steg
2. **Kunskapsbanken**: Läs artiklar organiserade efter kategori
   - Spåra läst/oläst status
   - Följ category progress
3. **Receptbanken**: Bläddra recept och markera favoriter
   - Filtrera efter måltidstyp och svårighetsgrad
   - Se näringsinfo och tillagningstid
4. **90-Dagars Roadmap**: Följ dag-för-dag artikeltilldelningar
5. **Check-in**: Veckovis check-in med vikt, foton, och metrics
   - Energi, mood, diet/workout adherence
   - Progress-foton (fram/sida/bak)
6. **Weight Tracker**: Se viktutveckling i graf över tid
7. **Tools**: Använd kaloriräknare, måltidsfördelning, stegräknare
8. **Lessons** (Legacy): Gå igenom interaktiva presentationer
   - Följ fas-baserad progression
   - Ta quiz för att testa kunskap

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
