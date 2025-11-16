import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🖼️ Updating Fläskfilé helstekt cover image...\n')

  // Find the recipe
  const recipe = await prisma.recipe.findFirst({
    where: {
      title: {
        contains: 'Fläskfilé helstekt',
        mode: 'insensitive'
      }
    }
  })

  if (!recipe) {
    throw new Error('Fläskfilé helstekt recipe not found')
  }

  // Update the cover image
  const updatedRecipe = await prisma.recipe.update({
    where: { id: recipe.id },
    data: {
      coverImage: 'https://i.postimg.cc/W3hCzzRc/2025-11-15-14-07-07-Tips-pa-tillagning-pdf-Adobe-Acrobat-Reader-(64-bit).png'
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
