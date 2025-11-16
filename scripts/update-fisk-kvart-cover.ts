import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🖼️ Updating Fisk på en kvart cover image...\n')

  // Find the recipe
  const recipe = await prisma.recipe.findFirst({
    where: {
      title: {
        contains: 'Fisk på en kvart',
        mode: 'insensitive'
      }
    }
  })

  if (!recipe) {
    throw new Error('Fisk på en kvart recipe not found')
  }

  // Update the cover image
  const updatedRecipe = await prisma.recipe.update({
    where: { id: recipe.id },
    data: {
      coverImage: 'https://i.postimg.cc/6qPPCXXC/2025-11-15-14-04-55-Tips-pa-tillagning-pdf-Adobe-Acrobat-Reader-(64-bit).png'
    }
  })

  console.log(`✅ Updated cover image for: ${updatedRecipe.title}`)
  console.log(`   - Recipe ID: ${updatedRecipe.id}`)
  console.log(`   - New cover image: ${updatedRecipe.coverImage}`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
