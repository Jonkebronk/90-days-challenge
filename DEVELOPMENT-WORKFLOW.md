# Development Workflow

## Important: Production-First Development

**This project deploys directly to production via GitHub and Railway.**

### Key Points:
- **ALWAYS check GitHub repo directly** - GitHub is the source of truth
- **Work from GitHub repository** - Verify code against live GitHub repo
- **NO local development** - All changes go directly to production
- **Always push to git** - Changes auto-deploy to Railway when pushed to GitHub
- Every code change should be committed and pushed immediately
- Build runs on Railway after each push

### Workflow:
1. Check GitHub repository for current codebase state
2. Make code changes to local git repository
3. Test build locally: `npm run build`
4. Commit changes: `git add . && git commit -m "message"`
5. Push to production: `git push`
6. Railway automatically builds and deploys from GitHub
7. Verify changes on GitHub to confirm push

### Source of Truth:
- **GitHub repository** is the canonical source
- Always verify files against GitHub before making changes
- Local files are only for editing, not reference
- After pushing, GitHub contains the live production code

### Database:
- Production database hosted on Railway
- Use `npx prisma db push` for schema changes (not migrations)
- Connection string in `.env` (Railway PostgreSQL)

### Never:
- Run development server locally (`npm run dev`)
- Test features locally before pushing
- Create separate environments or branches for testing
- Work without checking GitHub repo first

All changes are production changes that deploy directly from GitHub to Railway.
