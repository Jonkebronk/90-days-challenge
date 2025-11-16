import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Creating Sås category...\n')

  const category = await prisma.recipeCategory.create({
    data: {
      name: 'Sås',
      slug: 'sas',
      description: 'Såser och tillbehör',
    },
  })

  console.log(`✅ Category created: ${category.name} (slug: ${category.slug})`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
