const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  try {
    const cats = await prisma.recipeCategory.findMany({
      include: { subcategories: true }
    });
    console.log('Categories:', JSON.stringify(cats, null, 2));

    // Also check unique categories in recipes
    const recipeCats = await prisma.recipe.findMany({
      where: { published: true },
      select: { categoryId: true, category: { select: { name: true, slug: true } } },
      distinct: ['categoryId']
    });
    console.log('\nRecipe categories in use:', JSON.stringify(recipeCats, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main();
