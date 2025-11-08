const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixCoachEmail() {
  try {
    // Find user with uppercase email
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: 'Johnnystrandkonsult@gmail.com',
          mode: 'insensitive'
        }
      }
    })

    if (!user) {
      console.log('❌ No user found with email matching Johnnystrandkonsult@gmail.com')
      return
    }

    console.log('Found user:', user.email)
    console.log('Updating email to lowercase...')

    // Update to lowercase
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { email: 'johnnystrandkonsult@gmail.com' }
    })

    console.log('✅ Email updated successfully!')
    console.log('   Old: Johnnystrandkonsult@gmail.com')
    console.log('   New:', updated.email)
    console.log('   Role:', updated.role)
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

fixCoachEmail()
