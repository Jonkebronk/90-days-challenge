const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check products with bär in name
  const barProducts = await prisma.product.findMany({
    where: {
      name: { contains: 'bär', mode: 'insensitive' }
    },
    select: {
      id: true,
      name: true,
      category: true,
      subCategory: true,
      mainCategory: true
    },
    take: 20
  });

  console.log('Products with bär in name:', barProducts.length);
  barProducts.forEach(p => console.log(`- ${p.name}\n  category: ${p.category} | subCategory: ${p.subCategory} | mainCategory: ${p.mainCategory}\n`));

  // Check distinct categories in Product table
  console.log('\n\nDistinct categories in Product table:');
  const categories = await prisma.product.groupBy({
    by: ['category'],
    _count: true,
    orderBy: { _count: { category: 'desc' } },
    take: 30
  });
  categories.forEach(c => console.log(`- ${c.category || 'null'}: ${c._count} products`));
}

main().then(() => prisma.$disconnect()).catch(e => console.error(e));
