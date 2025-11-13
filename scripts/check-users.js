const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    console.log('📋 All users in database:\n')

    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        password: true
      }
    })

    if (allUsers.length === 0) {
      console.log('No users found in database.')
    } else {
      allUsers.forEach(user => {
        console.log(`Email: "${user.email}"`)
        console.log(`  Name: ${user.name || 'N/A'}`)
        console.log(`  Role: ${user.role}`)
        console.log(`  Status: ${user.status}`)
        console.log(`  Has password: ${user.password ? 'Yes' : 'No'}`)
        console.log('')
      })
    }

    console.log(`Total users: ${allUsers.length}`)

    // Check specifically for Johnny's account
    console.log('\n🔍 Searching for Johnny Strand accounts...')
    const johnnyAccounts = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: 'johnny', mode: 'insensitive' } },
          { email: { contains: 'strand', mode: 'insensitive' } }
        ]
      }
    })

    if (johnnyAccounts.length > 0) {
      console.log('Found matching accounts:')
      johnnyAccounts.forEach(user => {
        console.log(`  - "${user.email}" (${user.role})`)
      })
    } else {
      console.log('No accounts found matching "johnny" or "strand"')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()
