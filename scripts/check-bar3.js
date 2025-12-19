const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check products (not FoodItem) with bär in name
  const barProducts = await prisma.product.findMany({
    where: {
      name: { contains: 'bär', mode: 'insensitive' }
    },
    select: {
      id: true,
      name: true,
      macroCategory: true,
      isActive: true
    },
    take: 20
  });

  console.log('Products with bär in name:', barProducts.length);
  barProducts.forEach(p => console.log(`- ${p.name} | macroCategory: ${p.macroCategory} | isActive: ${p.isActive}`));

  // Also check all products with macroCategory = 'carb'
  const carbProducts = await prisma.product.count({
    where: { macroCategory: 'carb', isActive: true }
  });
  console.log('\nTotal active carb products:', carbProducts);

  // Check carb products with berry keywords
  const berryKeywords = ['bär', 'blåbär', 'hallon', 'jordgubb'];
  for (const keyword of berryKeywords) {
    const count = await prisma.product.count({
      where: {
        macroCategory: 'carb',
        isActive: true,
        name: { contains: keyword, mode: 'insensitive' }
      }
    });
    console.log(`Carb products with '${keyword}':`, count);
  }
}

main().then(() => prisma.$disconnect()).catch(e => console.error(e));
