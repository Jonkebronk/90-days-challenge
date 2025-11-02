# GitHub Codespaces Setup

## Arbeta 100% i molnet (ingen lokal utveckling)

### Vad är Codespaces?
GitHub Codespaces = VS Code i molnet + din utvecklingsmiljö

### Starta Codespace:

1. Gå till: https://github.com/Jonkebronk/90-days-challenge
2. Klicka på **Code** (grön knapp)
3. Välj **Codespaces** tab
4. Klicka **Create codespace on main**

→ Öppnas automatiskt i VS Code i browsern!

### Första gången:

```bash
# Codespaces kör automatiskt:
npm install
npx prisma generate

# Du behöver bara sätta .env:
cp .env.example .env

# Redigera .env och lägg till dina Railway credentials
```

### Utveckla:

```bash
# Starta dev server
npm run dev

# Öppnas automatiskt på https://xxx-3000.preview.app.github.dev
```

### Commit & Push:

```bash
git add .
git commit -m "Din commit message"
git push
```

→ Railway deployer automatiskt! 🚀

### Prisma Studio:

```bash
npx prisma studio
```

→ Öppnas på https://xxx-5555.preview.app.github.dev

## Gratis Tier:
- 60 timmar/månad gratis för personal accounts
- 120 core hours/månad
- Mer än tillräckligt för detta projekt!
