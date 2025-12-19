const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check berry products with full macro data
  console.log('=== BERRY PRODUCTS WITH MACROS ===\n');

  const berryProducts = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: 'hallon', mode: 'insensitive' } },
        { name: { contains: 'blåbär', mode: 'insensitive' } }
      ],
      category: 'kolhydratkallor'
    },
    select: {
      name: true,
      category: true,
      kcal: true,
      protein: true,
      carbs: true,
      fat: true,
      mealTypes: true
    }
  });

  berryProducts.forEach(p => {
    console.log(`${p.name}:`);
    console.log(`  kcal: ${p.kcal}, protein: ${p.protein}, carbs: ${p.carbs}, fat: ${p.fat}`);
    console.log(`  mealTypes: ${JSON.stringify(p.mealTypes)}`);
    console.log('');
  });

  // Also check a working carb product like Banan
  console.log('=== COMPARISON: BANAN ===\n');
  const banan = await prisma.product.findFirst({
    where: { name: { contains: 'Banan', mode: 'insensitive' } },
    select: {
      name: true,
      kcal: true,
      protein: true,
      carbs: true,
      fat: true,
      mealTypes: true
    }
  });

  if (banan) {
    console.log(`${banan.name}:`);
    console.log(`  kcal: ${banan.kcal}, protein: ${banan.protein}, carbs: ${banan.carbs}, fat: ${banan.fat}`);
    console.log(`  mealTypes: ${JSON.stringify(banan.mealTypes)}`);
  }
}

main().then(() => prisma.$disconnect()).catch(e => console.error(e));
