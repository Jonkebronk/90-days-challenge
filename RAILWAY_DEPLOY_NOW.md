# 🚂 Railway Deploy - Steg för Steg

## Följ dessa steg EXAKT:

### Steg 1: Öppna Railway (30 sekunder)

1. **Öppna:** https://railway.app/new
2. **Logga in** (om inte redan inloggad)
   - Använd GitHub account (om möjligt)

---

### Steg 2: Deploy från GitHub (1 minut)

1. **Välj:** "Deploy from GitHub repo"

   ![Deploy from GitHub](https://i.imgur.com/example.png)

2. **Om första gången:**
   - Railway frågar om GitHub access
   - Klicka **"Install Railway"**
   - Välj **"Only select repositories"**
   - Välj **`90-days-challenge`**
   - Klicka **"Install"**

3. **Välj repo:**
   - Du ser nu `Jonkebronk/90-days-challenge`
   - Klicka på den

4. **Klicka:** "Deploy Now"

5. **Vänta:**
   - Railway börjar bygga
   - Du ser en progress bar
   - **VÄNTA INTE på att den blir klar** - gå vidare till Steg 3!

---

### Steg 3: Lägg till PostgreSQL (30 sekunder)

**VIKTIGT:** Gör detta MEDAN första deployen pågår!

1. **I samma projekt,** klicka **"+ New"** (uppe till höger)

2. **Välj:** "Database"

3. **Välj:** "Add PostgreSQL"

4. **Vänta:**
   - PostgreSQL service skapas
   - Tar ~30 sekunder
   - När klar ser du "Postgres" service

✅ **Checkpoint:** Du har nu 2 services:
   - `90-days-challenge` (Next.js)
   - `Postgres` (Database)

---

### Steg 4: Koppla DATABASE_URL (1 minut)

1. **Klicka på:** `90-days-challenge` servicen (Next.js)

2. **Gå till:** "Variables" tab (i toppen)

3. **Klicka:** "+ New Variable"

4. **Lägg till:**
   ```
   Variable: DATABASE_URL
   Value: ${{Postgres.DATABASE_URL}}
   ```

   **EXAKT SÅ HÄR:**
   - Namn: `DATABASE_URL`
   - Värde: `${{Postgres.DATABASE_URL}}`
   - Detta är en Railway "reference" - den kopplar automatiskt till din PostgreSQL

5. **Klicka:** "Add" (eller Enter)

---

### Steg 5: Generera NEXTAUTH_SECRET (2 minuter)

**Öppna i ny tab:** https://generate-secret.vercel.app/32

1. **Kopiera** den genererade strängen (ser ut typ: `a7f9d8e6b2c4...`)

2. **Tillbaka till Railway** → Variables tab

3. **Klicka:** "+ New Variable"

4. **Lägg till:**
   ```
   Variable: NEXTAUTH_SECRET
   Value: [din-kopierade-sträng]
   ```

5. **Klicka:** "Add"

---

### Steg 6: Sätt NEXTAUTH_URL (30 sekunder)

**Fortfarande i Variables tab:**

1. **Klicka:** "+ New Variable"

2. **Lägg till:**
   ```
   Variable: NEXTAUTH_URL
   Value: ${{RAILWAY_PUBLIC_DOMAIN}}
   ```

   **EXAKT SÅ HÄR:**
   - `${{RAILWAY_PUBLIC_DOMAIN}}` är en Railway magic variable

3. **Klicka:** "Add"

✅ **Checkpoint:** Du har nu 3 environment variables:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`

---

### Steg 7: Custom Start Command (1 minut)

**Detta kör Prisma migrations vid deploy!**

1. **Klicka på:** `90-days-challenge` service (om inte redan där)

2. **Gå till:** "Settings" tab

3. **Scrolla ner till:** "Deploy" sektion

4. **Hitta:** "Custom Start Command"

5. **Klicka:** Pencil-ikonen (edit)

6. **Skriv in:**
   ```
   npx prisma migrate deploy && npm start
   ```

7. **Klicka:** Checkmark (save)

---

### Steg 8: Generate Domain (30 sekunder)

1. **Fortfarande i Settings tab**

2. **Scrolla till:** "Domains" sektion

3. **Klicka:** "Generate Domain"

4. **Kopiera URL:en** som genereras
   - Ser ut typ: `90-days-challenge-production-abc123.up.railway.app`

✅ **Detta är din live URL!**

---

### Steg 9: Triggera Re-deploy (30 sekunder)

**Eftersom vi ändrat environment variables:**

1. **Gå till:** "Deployments" tab

2. **Hitta senaste deployment** (högst upp)

3. **Klicka på:** de tre prickarna (...)

4. **Välj:** "Redeploy"

5. **Klicka:** "Redeploy" (confirm)

---

### Steg 10: Vänta på Deploy (2-3 minuter)

**Nu händer detta:**

1. Railway bygger din Next.js app
2. Installerar dependencies
3. Genererar Prisma Client
4. Kör `prisma migrate deploy` (skapar databastabeller)
5. Startar applikationen

**Se progress:**
- I "Deployments" tab
- Klicka på senaste deployment för att se logs

**När klar ser du:**
- ✅ Grön checkmark
- "Success"
- Din URL är live!

---

## 🎉 TESTA DIN APP!

### Öppna din Railway URL:

```
https://din-url.up.railway.app
```

### Du ska se:
- ✅ "90-Dagars Challenge" hemsida
- ✅ Kan gå till `/signup`
- ✅ Kan registrera användare
- ✅ Kan logga in
- ✅ Onboarding fungerar

---

## 🐛 Felsökning

### Deploy Failed?

**Kolla logs:**
1. Deployments tab
2. Klicka på failed deployment
3. Kolla "Build Logs" och "Deploy Logs"

**Vanliga problem:**

#### "Environment variable not found"
→ Dubbelkolla att alla 3 variables är satta korrekt

#### "Prisma migrate failed"
→ Kolla att DATABASE_URL är `${{Postgres.DATABASE_URL}}`

#### "Build error"
→ Gå till GitHub Actions och se om CI/CD passerar

### App körs men visar error?

**Kolla Runtime Logs:**
1. Klicka på din Next.js service
2. "Observability" tab
3. Se real-time logs

---

## ✅ Success Checklist

- [ ] Railway projekt skapat från GitHub repo
- [ ] PostgreSQL databas tillagd
- [ ] DATABASE_URL variabel satt
- [ ] NEXTAUTH_SECRET genererad och satt
- [ ] NEXTAUTH_URL satt till ${{RAILWAY_PUBLIC_DOMAIN}}
- [ ] Custom start command: `npx prisma migrate deploy && npm start`
- [ ] Domain genererad
- [ ] Deploy successful (grön checkmark)
- [ ] App öppnas på URL
- [ ] Kan registrera och logga in

---

## 🚀 Nästa Steg

**När deploy är klar:**

1. **Testa appen live**
2. **Öppna GitHub Codespace** för utveckling
3. **Börja bygga features!**

**Auto-deploy är nu aktivt:**
- Varje push till `main` → Railway deployer automatiskt
- GitHub Actions testar först
- Om green checkmark → live på Railway!

---

## 💰 Kostnad

Railway Free Tier:
- $5 worth of usage per month
- Mer än tillräckligt för utveckling!

När du når gränsen:
- Hobby Plan: $5/månad
- Includes everything du behöver

---

## 📞 Behöver Hjälp?

**Railway Docs:**
https://docs.railway.app

**Support:**
Railway har bra Discord community!

---

**GÅ IGENOM STEGEN NU!** 👆

Börja med Steg 1 och jobba dig igenom. Det tar ca 10 minuter totalt.
