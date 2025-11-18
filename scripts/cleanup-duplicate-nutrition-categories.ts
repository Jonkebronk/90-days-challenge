import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Cleaning up duplicate nutrition categories...')

  // Delete old 'eggs_dairy' key (replaced by 'dairy')
  const deleted1 = await prisma.nutritionCategory.deleteMany({
    where: {
      type: 'protein',
      key: 'eggs_dairy'
    }
  })
  console.log(`✓ Deleted eggs_dairy: ${deleted1.count} row(s)`)

  // Delete old 'plant' key (was incorrectly used for Fläsk)
  const deleted2 = await prisma.nutritionCategory.deleteMany({
    where: {
      type: 'protein',
      key: 'plant'
    }
  })
  console.log(`✓ Deleted plant: ${deleted2.count} row(s)`)

  console.log('✅ Cleanup completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
