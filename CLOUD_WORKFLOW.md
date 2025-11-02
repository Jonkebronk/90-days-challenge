# ☁️ 100% Cloud Development Workflow

**Ingen lokal utveckling - allt i molnet!**

## 🎯 Översikt

```
GitHub Codespaces → Committa → Auto CI/CD → Railway Deploy
```

**Du behöver aldrig jobba lokalt igen!**

---

## 🚀 Initial Setup (Engångsuppgift)

### 1. Railway Deployment (5 min)

**GÅ TILL:** https://railway.app

#### A. Deploy från GitHub
1. **+ New Project**
2. **Deploy from GitHub repo**
3. Välj **`Jonkebronk/90-days-challenge`**
4. **Deploy Now**

#### B. Lägg till PostgreSQL
1. I projektet, klicka **+ New**
2. **Database** → **Add PostgreSQL**
3. Vänta 30 sekunder

#### C. Environment Variables
Klicka på Next.js service → **Variables** tab:

```env
DATABASE_URL = ${{Postgres.DATABASE_URL}}
NEXTAUTH_URL = ${{RAILWAY_PUBLIC_DOMAIN}}
NEXTAUTH_SECRET = [generera med: https://generate-secret.vercel.app/32]
```

#### D. Custom Build Command
Settings tab → **Deploy** sektion:

**Custom Start Command:**
```
npx prisma migrate deploy && npm start
```

✅ **Klar!** Railway deployer nu automatiskt vid varje push till `main`

---

## 💻 Dagligt Arbetsflöde

### Alternativ 1: GitHub Codespaces (Rekommenderat)

#### Starta Codespace:

1. Gå till https://github.com/Jonkebronk/90-days-challenge
2. Klicka **Code** (grön knapp)
3. **Codespaces** tab
4. **Create codespace on main** (eller välj befintlig)

→ VS Code öppnas i browsern med hela dev-miljön!

#### Första gången i Codespace:

```bash
# Skapa .env fil
cp .env.example .env

# Lägg till Railway DATABASE_URL
# (Kopiera från Railway → PostgreSQL → Connect tab)
```

Redigera `.env`:
```env
DATABASE_URL="postgresql://postgres:xxx@xxx.railway.internal:5432/railway"
NEXTAUTH_URL="https://${CODESPACE_NAME}-3000.preview.app.github.dev"
NEXTAUTH_SECRET="din-secret-här"
```

```bash
# Generera Prisma Client
npx prisma generate

# Starta dev server
npm run dev
```

→ Automatiskt preview på `https://xxx-3000.preview.app.github.dev`

#### Utveckla feature:

```bash
# Skapa ny branch för feature
git checkout -b feature/min-nya-feature

# Gör ändringar i VS Code...

# Commit
git add .
git commit -m "Add: Min nya feature"

# Push till GitHub
git push -u origin feature/min-nya-feature
```

#### Skapa Pull Request:

1. GitHub visar automatiskt **"Compare & pull request"**
2. Klicka på den
3. Fyll i PR template
4. **Create pull request**

→ GitHub Actions kör automatiskt:
- ✅ ESLint
- ✅ TypeScript check
- ✅ Build test

#### Merge till main:

När PR är godkänd:
1. **Merge pull request**
2. **Confirm merge**

→ **Railway deployer automatiskt till produktion!** 🚀

---

### Alternativ 2: GitHub.dev (Snabbare, ingen terminal)

För snabba ändringar utan full dev miljö:

1. Gå till https://github.com/Jonkebronk/90-days-challenge
2. Tryck `.` (punkt-tangenten)

→ VS Code öppnas direkt i browsern!

**Användning:**
- ✅ Redigera filer
- ✅ Committa direkt från UI
- ❌ Ingen terminal
- ❌ Kan inte köra `npm run dev`

**Bra för:**
- README ändringar
- Fixa typos
- Små kod-ändringar

---

## 🔄 Branch Strategy

### Main Branch = Production
```
main → Railway Auto-Deploy → Live på internet
```

**Regler:**
- ❌ Pusha aldrig direkt till `main`
- ✅ Alltid via Pull Request
- ✅ CI/CD måste gå igenom

### Feature Branches
```
feature/onboarding-step-4
feature/dashboard-layout
feature/meal-builder
fix/login-bug
```

**Workflow:**
```bash
git checkout -b feature/ny-feature
# ... gör ändringar ...
git push -u origin feature/ny-feature
# ... skapa PR på GitHub ...
# ... merge när godkänd ...
```

---

## 🛠️ Användbara Kommandon (i Codespace)

### Development
```bash
npm run dev          # Starta dev server
npm run build        # Testa production build
npm run lint         # Kör ESLint
npx tsc --noEmit     # Type check
```

### Prisma
```bash
npx prisma studio              # GUI för databas (port 5555)
npx prisma generate            # Generera client
npx prisma migrate dev         # Skapa migration (dev)
npx prisma db push             # Push schema (development)
```

### Git
```bash
git status                     # Se ändringar
git checkout -b feature/namn   # Ny branch
git add .                      # Stage alla filer
git commit -m "message"        # Commit
git push                       # Push till GitHub
```

---

## 📊 Monitoring & Logs

### Railway Dashboard
https://railway.app/project/[ditt-projekt]

- **Deployments:** Se deploy-historik
- **Logs:** Real-time logs från produktion
- **Metrics:** CPU, Memory, Network usage
- **Variables:** Ändra env vars

### GitHub Actions
https://github.com/Jonkebronk/90-days-challenge/actions

- Se alla CI/CD runs
- Debug failures
- Re-run jobs

---

## 🚨 Troubleshooting

### "Build failed on Railway"
1. Kolla Railway logs
2. Testa `npm run build` i Codespace
3. Fixa errors
4. Committa fix
5. Push → Auto re-deploy

### "Database connection error"
1. Verifiera `DATABASE_URL` i Railway Variables
2. Kontrollera att PostgreSQL service körs
3. Testa connection i Codespace

### "Codespace won't start"
1. Gå till https://github.com/codespaces
2. Hitta din codespace
3. **Delete** och skapa ny

### "CI/CD check failed"
1. Gå till GitHub Actions tab
2. Klicka på failed run
3. Se vilken check som failade
4. Fixa i Codespace
5. Committa och pusha

---

## 💰 Kostnader

### GitHub Codespaces
- **60 timmar/månad gratis** (personal account)
- **120 core hours/månad**
- Stäng codespace när du inte jobbar!

### Railway
- **$5 gratis credits/månad**
- Hobby plan: $5/månad efter free tier
- PostgreSQL ingår

### Total kostnad
**$0-5/månad** för detta projekt! 🎉

---

## 📝 Checklista för varje feature

- [ ] Skapa feature branch från `main`
- [ ] Starta Codespace
- [ ] Implementera feature
- [ ] Testa lokalt (`npm run dev`)
- [ ] Kör linting (`npm run lint`)
- [ ] Build check (`npm run build`)
- [ ] Committa med bra meddelande
- [ ] Pusha till GitHub
- [ ] Skapa Pull Request
- [ ] Vänta på CI/CD (grön checkmark)
- [ ] Merge till main
- [ ] Verifiera deploy på Railway
- [ ] Testa live site

---

## 🎉 Du är nu setup för 100% cloud development!

**Flöde:**
1. Öppna Codespace
2. Gör ändringar
3. Committa & pusha
4. Skapa PR
5. Merge
6. Railway deployer automatiskt!

**Inga mer:**
- ❌ "Works on my machine"
- ❌ Lokal setup
- ❌ Manuell deploy
- ❌ Environment inconsistencies

**Allt i molnet! Jobba från vilken dator som helst!** ☁️🚀
