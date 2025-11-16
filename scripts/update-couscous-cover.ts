import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🖼️ Updating Couscous cover image...\n')

  // Find the couscous recipe
  const recipe = await prisma.recipe.findFirst({
    where: {
      title: {
        contains: 'Couscous',
        mode: 'insensitive'
      }
    }
  })

  if (!recipe) {
    throw new Error('Couscous recipe not found')
  }

  // Update the cover image
  const updatedRecipe = await prisma.recipe.update({
    where: { id: recipe.id },
    data: {
      coverImage: 'https://i.postimg.cc/ZnYmwZ2H/2025-11-15-14-03-34-Tips-pa-tillagning-pdf-Adobe-Acrobat-Reader-(64-bit).png'
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
