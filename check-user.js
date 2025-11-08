const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkUser() {
  const user = await prisma.user.findUnique({
    where: { email: 'jonkebronk@gmail.com' }
  })
  console.log('User:', user)
  await prisma.$disconnect()
}

checkUser()
