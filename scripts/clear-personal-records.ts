import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const result = await prisma.personalRecord.deleteMany({})
  console.log('Deleted', result.count, 'personal records')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
