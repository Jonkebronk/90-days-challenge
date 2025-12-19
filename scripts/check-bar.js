const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find food items with 'bär' in subcategory or name
  const barItems = await prisma.foodItem.findMany({
    where: {
      OR: [
        { subcategory: { contains: 'bär', mode: 'insensitive' } },
        { name: { contains: 'bär', mode: 'insensitive' } }
      ]
    },
    select: { id: true, name: true, subcategory: true, categoryId: true }
  });
  console.log('Food items with bär:', barItems.length);
  barItems.forEach(f => console.log('-', f.name, '| subcategory:', f.subcategory));

  // List distinct subcategories in Frukt & Bär category
  const fruktBarCategory = await prisma.nutritionCategory.findFirst({
    where: { name: { contains: 'Frukt', mode: 'insensitive' } }
  });
  console.log('\nFrukt & Bär category ID:', fruktBarCategory?.id);

  if (fruktBarCategory) {
    const subs = await prisma.foodItem.groupBy({
      by: ['subcategory'],
      where: { categoryId: fruktBarCategory.id },
      _count: true
    });
    console.log('Subcategories in Frukt & Bär:', subs);
  }
}

main().then(() => prisma.$disconnect()).catch(e => console.error(e));
