const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Same mapping as in the API
const CATEGORY_TO_MACRO = {
  'proteinkallor': 'protein',
  'proteinkällor': 'protein',
  'kolhydratkallor': 'carb',
  'kolhydratkällor': 'carb',
  'bar': 'carb',
  'bär': 'carb',
  'fettkallor': 'fat',
  'fettkällor': 'fat',
  'gronsaker': 'vegetable',
  'grönsaker': 'vegetable',
  'sasar': 'sauce',
  'såsar': 'sauce',
};

function getCategoriesForMacro(macroCategory) {
  return Object.entries(CATEGORY_TO_MACRO)
    .filter(([_, macro]) => macro === macroCategory)
    .map(([cat, _]) => cat);
}

async function main() {
  const macroCategory = 'carb';
  const categoriesForMacro = getCategoriesForMacro(macroCategory);

  console.log('Categories for carb:', categoriesForMacro);

  // Simulate the API query
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { macroCategory: macroCategory },
        { category: { in: categoriesForMacro, mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      name: true,
      category: true,
      macroCategory: true
    },
    take: 50
  });

  console.log('\nProducts found:', products.length);

  // Filter to show only berry-related
  const berryProducts = products.filter(p =>
    p.name.toLowerCase().includes('bär') ||
    p.name.toLowerCase().includes('blåbär') ||
    p.name.toLowerCase().includes('hallon')
  );
  console.log('\nBerry products:', berryProducts.length);
  berryProducts.forEach(p => console.log(`- ${p.name} | category: ${p.category}`));
}

main().then(() => prisma.$disconnect()).catch(e => console.error(e));
