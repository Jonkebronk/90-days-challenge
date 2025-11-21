import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🖼️ Uppdaterar bild för Knäckebröd med keso...')

  try {
    const recipe = await prisma.recipe.updateMany({
      where: {
        title: 'Knäckebröd med keso'
      },
      data: {
        coverImage: 'https://i.postimg.cc/x1hzkzvX/2025-11-20-16-36-38-Recipe-Keeper.png'
      }
    })

    console.log('✓ Uppdaterade receptbild')

  } catch (error) {
    console.error('❌ Fel:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
