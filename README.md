# 90-Dagars Challenge

En interaktiv webbapp där användare bygger sin personliga 90-dagarsplan för kost och träning.

## Status

### ✅ Klart
- [x] Next.js projekt setup med TypeScript och Tailwind CSS
- [x] Supabase integration (@supabase/ssr)
- [x] shadcn/ui komponenter installerade
- [x] Authentication (login, signup)
- [x] Middleware för route protection
- [x] TDEE och macro calculations
- [x] TypeScript typer
- [x] Onboarding steg 1-3 (Profile, Goals, Lifestyle)

### 🚧 Återstående arbete

#### Onboarding (Steg 4-8)
- [ ] Steg 4: Nutrition preferences
- [ ] Steg 5: TDEE calculator (live calculations)
- [ ] Steg 6: Meal builder (drag-and-drop)
- [ ] Steg 7: Workout designer (drag-and-drop)
- [ ] Steg 8: Summary & save to Supabase

#### Supabase Database
- [ ] Kör SQL schema i Supabase SQL Editor (se `COMPLETE_DOCUMENTATION.md`)
- [ ] Lägg till seed data för exercises och food_items

#### Dashboard
- [ ] Dashboard layout
- [ ] Dagens checklist
- [ ] Fas-indikator
- [ ] Veckans kunskapsmodul
- [ ] Statistik (senaste 7 dagarna)

#### Features
- [ ] Meal builder med drag-and-drop
- [ ] Meal logging
- [ ] Food library
- [ ] Workout builder
- [ ] Workout logging
- [ ] Exercise library
- [ ] Daily check-in
- [ ] Progress dashboard med charts
- [ ] Knowledge modules

## Kom igång

### 1. Installera dependencies
```bash
npm install
```

### 2. Konfigurera Supabase
1. Gå till https://supabase.com och skapa ett nytt projekt
2. Kopiera **Project URL** och **anon/public key** från Settings → API
3. Uppdatera `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=din-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=din-anon-key
```

### 3. Skapa databastabeller
1. Öppna SQL Editor i Supabase Dashboard
2. Kopiera hela SQL-schemat från `C:\Users\johnn\Downloads\COMPLETE_DOCUMENTATION.md` (sektion 4: DATABASE SCHEMA)
3. Kör SQL:et för att skapa alla tabeller och relationer

### 4. Starta utvecklingsservern
```bash
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000)

## Projektstruktur

```
90-days-challenge/
├── app/
│   ├── (auth)/              # Login, signup
│   │   ├── login/
│   │   └── signup/
│   ├── (onboarding)/        # Onboarding steg 1-8
│   │   ├── step-1/          # ✅ Profile
│   │   ├── step-2/          # ✅ Goals
│   │   ├── step-3/          # ✅ Lifestyle
│   │   ├── step-4/          # 🚧 Nutrition
│   │   ├── step-5/          # 🚧 TDEE Calculator
│   │   ├── step-6/          # 🚧 Meal Builder
│   │   ├── step-7/          # 🚧 Workout Designer
│   │   └── step-8/          # 🚧 Summary
│   ├── (dashboard)/         # 🚧 Dashboard routes
│   └── globals.css
├── components/
│   └── ui/                  # shadcn/ui komponenter
├── lib/
│   ├── supabase/
│   │   ├── client.ts        # ✅ Client-side Supabase
│   │   └── server.ts        # ✅ Server-side Supabase
│   ├── calculations/
│   │   ├── tdee.ts          # ✅ BMR, TDEE beräkningar
│   │   └── macros.ts        # ✅ Protein, carbs, fat
│   └── types/
│       └── index.ts         # ✅ TypeScript interfaces
└── middleware.ts            # ✅ Auth protection

```

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Forms**: react-hook-form + zod
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Drag & Drop**: @dnd-kit

## Nästa steg

1. **Konfigurera Supabase** - Lägg till URL och API key i `.env.local`
2. **Kör databas-setup** - Kör SQL från dokumentationen
3. **Testa auth** - Skapa ett konto via `/signup`
4. **Fortsätt onboarding** - Implementera steg 4-8
5. **Bygg dashboard** - Skapa huvudvyn för användare

## Dokumentation

All komplett dokumentation finns i `C:\Users\johnn\Downloads\COMPLETE_DOCUMENTATION.md`

Den innehåller:
- Detaljerade feature-specifikationer
- Databas-schema med alla tabeller
- Beräkningsformler för TDEE och makros
- Design-principer
- Claude Code prompts för varje feature

## Utvecklingsguide

### Skapa nya onboarding-steg
Följ samma mönster som steg 1-3:
1. Skapa `app/(onboarding)/step-X/page.tsx`
2. Använd zod för validation
3. Spara till localStorage
4. Navigera till nästa steg

### Arbeta med Supabase
```typescript
// Client-side
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()

// Server-side
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
```

### Använda beräkningar
```typescript
import { calculateBMR, calculateTDEE } from '@/lib/calculations/tdee'
import { calculateMacros } from '@/lib/calculations/macros'

const bmr = calculateBMR(75, 175, 25, 'male')
const tdee = calculateTDEE(bmr, 'moderate')
const macros = calculateMacros(2000, 75, 'lose_weight')
```

## Licens

Detta är ett personligt projekt.
