const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function check() {
  const sources = await prisma.product.groupBy({
    by: ['source'],
    _count: { source: true }
  })

  console.log('Sources i produktbiblioteket:')
  console.log('─'.repeat(35))

  let total = 0
  sources.sort((a, b) => b._count.source - a._count.source).forEach(s => {
    console.log(`  ${(s.source || 'null').padEnd(20)} ${s._count.source}`)
    total += s._count.source
  })

  console.log('─'.repeat(35))
  console.log(`  TOTALT`.padEnd(22) + total)

  await prisma.$disconnect()
}
check()
