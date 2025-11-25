const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const guide = await prisma.guideContent.findFirst({
    where: { type: 'nutrition_tips' }
  })

  if (guide) {
    console.log('===== FIRST 1000 CHARACTERS =====')
    console.log(guide.content.substring(0, 1000))
    console.log('\n===== END =====')
  } else {
    console.log('No nutrition tips found')
  }

  await prisma.$disconnect()
}

main().catch(console.error)
