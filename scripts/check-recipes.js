const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  // Check all recipes
  const allRecipes = await prisma.recipe.findMany({
    select: {
      id: true,
      title: true,
      mealType: true,
      published: true,
      caloriesPerServing: true,
    }
  });

  console.log('Total recipes:', allRecipes.length);
  console.log('\nRecipes by mealType:');

  const byType = {};
  allRecipes.forEach(r => {
    const type = r.mealType || 'null';
    if (!byType[type]) byType[type] = [];
    byType[type].push({ title: r.title, published: r.published, calories: r.caloriesPerServing });
  });

  Object.entries(byType).forEach(([type, recipes]) => {
    console.log('\n' + type + ':', recipes.length);
    recipes.slice(0, 3).forEach(r => console.log('  -', r.title, '| published:', r.published, '| kcal:', r.calories));
  });

  // Check published with calories
  const publishedWithCalories = allRecipes.filter(r =>
    r.published && r.caloriesPerServing && Number(r.caloriesPerServing) > 0
  );
  console.log('\n\nPublished recipes with calories:', publishedWithCalories.length);

  await prisma.$disconnect();
}

check().catch(console.error);
