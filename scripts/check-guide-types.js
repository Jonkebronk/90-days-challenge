const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const guides = await prisma.guideContent.findMany({
    select: {
      id: true,
      type: true,
      title: true,
    },
    orderBy: {
      type: 'asc'
    }
  })

  console.log('\n===== ALL GUIDE TYPES =====')
  guides.forEach(guide => {
    console.log(`Type: ${guide.type}`)
    console.log(`  Title: ${guide.title}`)
    console.log(`  ID: ${guide.id}`)
    console.log('')
  })

  await prisma.$disconnect()
}

main().catch(console.error)
