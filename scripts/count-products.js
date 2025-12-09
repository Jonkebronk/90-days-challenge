const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const total = await prisma.product.count()
  const byCategory = await prisma.product.groupBy({
    by: ['mainCategory'],
    _count: true,
  })

  // Sort by count descending
  byCategory.sort((a, b) => b._count - a._count)

  console.log('Total produkter:', total)
  console.log('')
  console.log('Per huvudkategori:')
  byCategory.forEach(c => {
    console.log('  ' + (c.mainCategory || 'Okategoriserad') + ': ' + c._count)
  })
}

main().catch(console.error).finally(() => prisma.$disconnect())
