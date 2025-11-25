import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Fetching all FAQ categories...\n')

  const categories = await prisma.faqCategory.findMany({
    orderBy: { orderIndex: 'asc' },
    include: {
      _count: {
        select: { questions: true }
      }
    }
  })

  if (categories.length === 0) {
    console.log('No FAQ categories found in database.')
  } else {
    console.log(`Found ${categories.length} FAQ categories:\n`)
    categories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name}`)
      console.log(`   ID: ${cat.id}`)
      console.log(`   Slug: ${cat.slug}`)
      console.log(`   Description: ${cat.description || '(ingen beskrivning)'}`)
      console.log(`   Order: ${cat.orderIndex}`)
      console.log(`   Questions: ${cat._count.questions}`)
      console.log(`   Created: ${cat.createdAt}`)
      console.log('')
    })
  }
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
