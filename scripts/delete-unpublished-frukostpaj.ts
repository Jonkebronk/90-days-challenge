import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️  Finding unpublished "Proteinrik frukostpaj"...\n')

  const unpublished = await prisma.recipe.findFirst({
    where: {
      title: 'Proteinrik frukostpaj',
      published: false
    },
    include: {
      ingredients: true,
      instructions: true
    }
  })

  if (!unpublished) {
    console.log('No unpublished recipe found')
    return
  }

  console.log(`Found unpublished recipe: ${unpublished.title} (ID: ${unpublished.id})`)
  console.log(`  - Ingredients: ${unpublished.ingredients.length}`)
  console.log(`  - Instructions: ${unpublished.instructions.length}`)
  console.log('\nDeleting...')

  // Delete ingredients first
  await prisma.recipeIngredient.deleteMany({
    where: { recipeId: unpublished.id }
  })

  // Delete instructions
  await prisma.recipeInstruction.deleteMany({
    where: { recipeId: unpublished.id }
  })

  // Delete recipe
  await prisma.recipe.delete({
    where: { id: unpublished.id }
  })

  console.log(`✅ Deleted unpublished recipe: ${unpublished.title}`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
