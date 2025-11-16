import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('📝 Creating "Tips på tillagning" category...\n')

  // Check if category already exists
  const existingCategory = await prisma.recipeCategory.findFirst({
    where: { slug: 'tips-pa-tillagning' }
  })

  if (existingCategory) {
    console.log('⚠️  Category "Tips på tillagning" already exists!')
    console.log(`   - ID: ${existingCategory.id}`)
    console.log(`   - Name: ${existingCategory.name}`)
    console.log(`   - Slug: ${existingCategory.slug}`)
    return
  }

  // Create the new category
  const category = await prisma.recipeCategory.create({
    data: {
      name: 'Tips på tillagning',
      slug: 'tips-pa-tillagning',
      description: 'Användbara tips och tricks för matlagning',
    },
  })

  console.log(`✅ Category created: ${category.name} (ID: ${category.id})`)
  console.log(`   - Slug: ${category.slug}`)
  console.log(`   - Description: ${category.description}`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
