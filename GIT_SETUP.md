# GitHub Setup - 90-Dagars Challenge

## ✅ Git Repository Initierat!

Din lokala Git repository är nu skapad med en initial commit.

## Steg 1: Skapa GitHub Repository

### Alternativ A: Via GitHub Web (Enklast)

1. **Gå till GitHub**
   - Öppna https://github.com/new
   - (Eller gå till https://github.com → klicka "+" → "New repository")

2. **Fyll i detaljer:**
   - **Repository name:** `90-days-challenge`
   - **Description:** "90-dagars challenge app för kost och träning med Railway + Prisma + NextAuth"
   - **Visibility:** Public eller Private (ditt val)
   - **⚠️ VIKTIGT:** Kryssa INTE i "Add README", "Add .gitignore" eller "Choose license"
     - (Vi har redan dessa filer!)

3. **Klicka "Create repository"**

4. **Kopiera URL:en som visas**
   - Du ser något liknande:
   ```
   https://github.com/dittnamn/90-days-challenge.git
   ```

### Alternativ B: Via GitHub CLI (Om du har gh installerat)

```bash
gh repo create 90-days-challenge --public --description "90-dagars challenge app" --source=.
```

## Steg 2: Koppla till Remote

Använd URL:en från GitHub:

```bash
cd C:\Users\johnn\90-days-challenge

# Lägg till remote
git remote add origin https://github.com/DITTNAMN/90-days-challenge.git

# Verifiera
git remote -v
```

Du ska se:
```
origin  https://github.com/DITTNAMN/90-days-challenge.git (fetch)
origin  https://github.com/DITTNAMN/90-days-challenge.git (push)
```

## Steg 3: Push till GitHub

```bash
# Push till main branch
git branch -M main
git push -u origin main
```

### Om du får autentiseringsfel:

**Windows Git Credential Manager:**
1. Första gången du pushar kommer Windows att fråga efter credentials
2. Välj "Sign in with your browser"
3. Logga in på GitHub i browsern
4. Credentials sparas automatiskt

**Eller använd Personal Access Token:**
1. Gå till https://github.com/settings/tokens
2. Generate new token (classic)
3. Välj scopes: `repo`
4. Kopiera token
5. Använd token som lösenord när du pushar

## ✅ Klart!

Nu är ditt projekt på GitHub!

### Verifiera:

Gå till `https://github.com/DITTNAMN/90-days-challenge`

Du ska se:
- ✅ Alla filer
- ✅ README.md
- ✅ Initial commit message

## Nästa Steg: Deploy på Railway (Optional)

Nu när projektet är på GitHub kan du enkelt deploya till Railway:

### 1. Railway Dashboard

1. Gå till https://railway.app
2. Klicka "+ New"
3. Välj "Deploy from GitHub repo"
4. Välj `90-days-challenge`

### 2. Lägg till PostgreSQL

1. I samma projekt, klicka "+ New"
2. Välj "Database" → "PostgreSQL"
3. Railway kopplar automatiskt DATABASE_URL

### 3. Environment Variables

Gå till projekt → Settings → Variables:

Lägg till:
```env
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Auto från PostgreSQL service
NEXTAUTH_URL=https://din-app.up.railway.app
NEXTAUTH_SECRET=din-production-secret-här
```

### 4. Deploy!

Railway deployer automatiskt när du pushar till GitHub!

```bash
git add .
git commit -m "Update something"
git push
```

→ Railway detekterar push och deployer automatiskt 🚀

## Tips

### Se Git Status
```bash
git status
```

### Se Commit History
```bash
git log --oneline
```

### Skapa ny branch
```bash
git checkout -b feature/ny-feature
```

### Push ny branch till GitHub
```bash
git push -u origin feature/ny-feature
```

### Uppdatera från GitHub
```bash
git pull
```

## Troubleshooting

### "Authentication failed"
→ Använd Personal Access Token istället för lösenord

### "Remote origin already exists"
→ Ta bort och lägg till igen:
```bash
git remote remove origin
git remote add origin https://github.com/DITTNAMN/90-days-challenge.git
```

### "refusing to merge unrelated histories"
→ Du har skapat README på GitHub, force push:
```bash
git push -u origin main --force
```
**⚠️ Varning:** Detta skriver över GitHub repo

---

## 🎉 Lycka till!

Ditt projekt är nu versionshanterat och kan delas/deployas enkelt!
