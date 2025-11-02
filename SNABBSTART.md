# 🚀 Snabbstart - 90-Dagars Challenge

## Steg 1: Supabase Setup (5 min)

### 1.1 Skapa projekt
1. Gå till https://supabase.com
2. Klicka "New Project"
3. Välj organisation (eller skapa ny)
4. Fyll i:
   - **Name**: 90-days-challenge
   - **Database Password**: (välj ett säkert lösenord)
   - **Region**: (välj närmaste, t.ex. North Europe)
5. Klicka "Create new project"
6. Vänta 1-2 minuter medan projektet skapas

### 1.2 Kopiera credentials
1. Gå till **Settings** → **API**
2. Kopiera:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")

### 1.3 Uppdatera .env.local
Öppna `.env.local` och klistra in:
```env
NEXT_PUBLIC_SUPABASE_URL=https://dinprojektid.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=din-långa-anon-key-här
```

## Steg 2: Databas Schema (3 min)

### 2.1 Öppna SQL Editor
1. I Supabase Dashboard, gå till **SQL Editor** (vänster meny)
2. Klicka "New Query"

### 2.2 Kör SQL
1. Öppna `C:\Users\johnn\Downloads\COMPLETE_DOCUMENTATION.md`
2. Scrolla till **sektion 4: DATABASE SCHEMA**
3. Kopiera HELA SQL-koden (från `-- Profiles` till slutet av seed data)
4. Klistra in i SQL Editor
5. Klicka **Run** (eller Ctrl+Enter)

Du ska se meddelande: "Success. No rows returned"

### 2.3 Verifiera tabeller
1. Gå till **Table Editor** i vänster meny
2. Du ska se alla tabeller:
   - profiles
   - user_profiles
   - nutrition_plans
   - food_items (med 3 exempel-items)
   - exercises (med 2 exempel-övningar)
   - meals
   - workout_plans
   - daily_logs
   - osv.

## Steg 3: Starta projektet (1 min)

```bash
npm run dev
```

Öppna http://localhost:3000

## Steg 4: Testa appen

### 4.1 Skapa konto
1. Gå till http://localhost:3000/signup
2. Fyll i:
   - Fullständigt namn
   - E-post
   - Lösenord (minst 6 tecken)
3. Klicka "Skapa konto"

**OBS**: Supabase skickar verifikationsmail som standard. Om du vill hoppa över detta:
1. Gå till Supabase Dashboard → **Authentication** → **Settings**
2. Scrolla till "Email Confirmations"
3. Stäng av "Enable email confirmations"

### 4.2 Testa onboarding
Efter signup redirectas du till `/onboarding/step-1`:
- **Steg 1**: Fyll i ålder, kön, längd, vikt
- **Steg 2**: Välj mål (gå ner i vikt/bygga muskler/hälsa)
- **Steg 3**: Välj livsstil och träningsfrekvens

### 4.3 Nästa steg
Efter steg 3 saknas steg 4-8 ännu. Dessa behöver du implementera:
- Steg 4: Nutrition preferences
- Steg 5: TDEE calculator (visar live beräkningar)
- Steg 6: Meal builder (drag-and-drop)
- Steg 7: Workout designer
- Steg 8: Summary + spara till Supabase

## Troubleshooting

### Problem: "Invalid API key"
- Kontrollera att du kopierat rätt key från Supabase
- Se till att det är **anon public** key, inte service_role

### Problem: "relation does not exist"
- Du har inte kört SQL-schemat än
- Gå tillbaka till Steg 2 och kör SQL

### Problem: Email confirmation krävs
- Gå till Authentication → Settings
- Stäng av "Enable email confirmations"
- ELLER kontrollera din inbox för verifikationsmail

### Problem: "Failed to fetch"
- Kontrollera att dev-servern kör (`npm run dev`)
- Verifiera att NEXT_PUBLIC_SUPABASE_URL är korrekt

## Nästa utvecklingssteg

Följ prioriteringarna från dokumentationen:

### Priority 1-5 (Klart)
- ✅ Authentication
- ✅ Onboarding steg 1-3
- ✅ TDEE calculations

### Priority 6-8 (Nästa)
- [ ] Onboarding steg 4-8
- [ ] Dashboard
- [ ] Meal Builder
- [ ] Workout Builder

### För varje ny feature:
1. Läs motsvarande sektion i `COMPLETE_DOCUMENTATION.md`
2. Se exempel-prompts i sektion 8
3. Implementera enligt prioritetsordning

## Tips för utveckling

### Debugging Supabase queries
```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')

console.log('Data:', data)
console.log('Error:', error)
```

### Testa calculations
```typescript
import { calculateBMR, calculateTDEE } from '@/lib/calculations/tdee'

const bmr = calculateBMR(75, 175, 25, 'male')
// Resultat: ~1700 kcal

const tdee = calculateTDEE(bmr, 'moderate')
// Resultat: ~2635 kcal
```

### Använd shadcn CLI för nya komponenter
```bash
npx shadcn@latest add [component-name]
```

Exempel:
```bash
npx shadcn@latest add checkbox
npx shadcn@latest add badge
```

## Support

- **Dokumentation**: Se `COMPLETE_DOCUMENTATION.md`
- **README**: Se `README.md` för projektstruktur
- **Supabase Docs**: https://supabase.com/docs
- **shadcn/ui**: https://ui.shadcn.com

Lycka till! 💪
