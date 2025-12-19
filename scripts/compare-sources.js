const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check products by category
  console.log('=== PRODUCTS BY CATEGORY ===\n');

  const categories = await prisma.product.groupBy({
    by: ['category'],
    _count: true,
    orderBy: { _count: { category: 'desc' } }
  });

  categories.forEach(c => console.log(`${c.category || 'null'}: ${c._count} products`));

  // Check protein products
  console.log('\n=== PROTEIN PRODUCTS (first 10) ===');
  const proteinProducts = await prisma.product.findMany({
    where: {
      category: { in: ['proteinkallor', 'proteinkällor'], mode: 'insensitive' }
    },
    select: { name: true, category: true, mealTypes: true },
    take: 10
  });
  proteinProducts.forEach(p => console.log(`- ${p.name} | mealTypes: ${JSON.stringify(p.mealTypes)}`));

  // Check carb products
  console.log('\n=== CARB PRODUCTS (first 10) ===');
  const carbProducts = await prisma.product.findMany({
    where: {
      category: { in: ['kolhydratkallor', 'kolhydratkällor'], mode: 'insensitive' }
    },
    select: { name: true, category: true, mealTypes: true },
    take: 10
  });
  carbProducts.forEach(p => console.log(`- ${p.name} | mealTypes: ${JSON.stringify(p.mealTypes)}`));

  // Check berry products specifically
  console.log('\n=== BERRY PRODUCTS ===');
  const berryProducts = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: 'bär', mode: 'insensitive' } },
        { name: { contains: 'hallon', mode: 'insensitive' } },
        { name: { contains: 'blåbär', mode: 'insensitive' } }
      ]
    },
    select: { name: true, category: true, mealTypes: true }
  });
  console.log(`Found ${berryProducts.length} berry products:`);
  berryProducts.forEach(p => console.log(`- ${p.name} | category: ${p.category} | mealTypes: ${JSON.stringify(p.mealTypes)}`));

  // Check what mealTypes means
  console.log('\n=== MEALTYPES DISTRIBUTION ===');
  const withMealTypes = await prisma.product.count({
    where: { NOT: { mealTypes: { isEmpty: true } } }
  });
  const withoutMealTypes = await prisma.product.count({
    where: { mealTypes: { isEmpty: true } }
  });
  console.log(`Products WITH mealTypes: ${withMealTypes}`);
  console.log(`Products WITHOUT mealTypes: ${withoutMealTypes}`);
}

main().then(() => prisma.$disconnect()).catch(e => console.error(e));
