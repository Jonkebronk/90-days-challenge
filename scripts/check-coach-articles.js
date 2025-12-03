const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find all categories with audience='coach'
  const coachCategories = await prisma.articleCategory.findMany({
    where: { audience: 'coach' },
    include: { articles: { select: { id: true, title: true, published: true } } }
  });

  console.log('Coach categories:', coachCategories.length);
  coachCategories.forEach(cat => {
    console.log('- Category:', cat.name, '| Articles:', cat.articles.length);
    cat.articles.forEach(a => console.log('  -', a.title, '| Published:', a.published));
  });

  // Also check total coach articles
  const allCoachArticles = await prisma.article.findMany({
    where: {
      category: { audience: 'coach' }
    },
    select: { id: true, title: true, published: true }
  });
  console.log('\nTotal coach articles:', allCoachArticles.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
