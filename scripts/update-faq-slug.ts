import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const categoryId = 'cmhrom9xb0001o10qqwpbt4qr'
  const newSlug = 'kostschema-vecka-1'

  console.log('Updating FAQ category slug...\n')

  const category = await prisma.faqCategory.update({
    where: { id: categoryId },
    data: { slug: newSlug }
  })

  console.log('✅ Successfully updated category:')
  console.log(`   Name: ${category.name}`)
  console.log(`   Old slug: kost`)
  console.log(`   New slug: ${category.slug}`)
  console.log('\nYou can now create a new category named "Kost"!')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
