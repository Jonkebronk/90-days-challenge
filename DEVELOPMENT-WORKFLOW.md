# Development Workflow

## Important: Production-First Development

**This project deploys directly to production via GitHub and Railway.**

### Key Points:
- **NO local development** - All changes go directly to production
- **Always push to git** - Changes auto-deploy to Railway when pushed to GitHub
- Every code change should be committed and pushed immediately
- Build runs on Railway after each push

### Workflow:
1. Make code changes
2. Test build locally: `npm run build`
3. Commit changes: `git add . && git commit -m "message"`
4. Push to production: `git push`
5. Railway automatically builds and deploys

### Database:
- Production database hosted on Railway
- Use `npx prisma db push` for schema changes (not migrations)
- Connection string in `.env` (Railway PostgreSQL)

### Never:
- Run development server locally (`npm run dev`)
- Test features locally before pushing
- Create separate environments or branches for testing

All changes are production changes.
