import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding nutrition categories...')

  // Carbs categories
  const carbsCategories = [
    { type: 'carbs', key: 'grains', name: 'Spannmål & Gröt', order: 0 },
    { type: 'carbs', key: 'bread', name: 'Bröd & Pasta', order: 1 },
    { type: 'carbs', key: 'roots', name: 'Rotfrukter', order: 2 },
    { type: 'carbs', key: 'legumes', name: 'Baljväxter', order: 3 },
    { type: 'carbs', key: 'fruits', name: 'Frukt & Bär', order: 4 },
  ]

  // Fat categories
  const fatCategories = [
    { type: 'fat', key: 'nuts', name: 'Nötter', order: 0 },
    { type: 'fat', key: 'seeds', name: 'Frön', order: 1 },
    { type: 'fat', key: 'oils', name: 'Oljor & Fetter', order: 2 },
    { type: 'fat', key: 'spreads', name: 'Pålägg & Nötsmör', order: 3 },
    { type: 'fat', key: 'fruits', name: 'Frukt', order: 4 },
  ]

  // Create carbs categories
  for (const cat of carbsCategories) {
    await prisma.nutritionCategory.upsert({
      where: { type_key: { type: cat.type, key: cat.key } },
      update: { name: cat.name, order: cat.order },
      create: cat,
    })
    console.log(`✓ Created/Updated: ${cat.name}`)
  }

  // Create fat categories
  for (const cat of fatCategories) {
    await prisma.nutritionCategory.upsert({
      where: { type_key: { type: cat.type, key: cat.key } },
      update: { name: cat.name, order: cat.order },
      create: cat,
    })
    console.log(`✓ Created/Updated: ${cat.name}`)
  }

  console.log('✅ Nutrition categories seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
