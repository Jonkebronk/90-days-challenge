const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find food items with 'bär' in name
  const barItems = await prisma.foodItem.findMany({
    where: {
      name: { contains: 'bär', mode: 'insensitive' }
    },
    select: {
      id: true,
      name: true,
      subcategory: true,
      categoryId: true,
      category: { select: { name: true } }
    },
    take: 20
  });

  console.log('Food items with bär in name:\n');
  barItems.forEach(f => console.log(`- ${f.name}\n  Category: ${f.category?.name || 'NONE'} (${f.categoryId || 'null'})\n`));

  // Check all nutrition categories
  console.log('\n\nAll nutrition categories:');
  const categories = await prisma.nutritionCategory.findMany({
    include: { _count: { select: { foodItems: true } } }
  });
  categories.forEach(c => console.log(`- ${c.name}: ${c._count.foodItems} items`));
}

main().then(() => prisma.$disconnect()).catch(e => console.error(e));
