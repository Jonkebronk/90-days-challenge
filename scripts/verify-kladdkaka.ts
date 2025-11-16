import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking for Kladdkaka med kaseinfluff...\n')

  // Find the recipe
  const recipe = await prisma.recipe.findFirst({
    where: {
      title: { contains: 'Kladdkaka', mode: 'insensitive' }
    },
    include: {
      category: true,
      ingredients: {
        include: {
          foodItem: true
        }
      },
      instructions: true
    }
  })

  if (!recipe) {
    console.log('❌ Recipe not found!')
    return
  }

  console.log('✅ Recipe found:')
  console.log(`   ID: ${recipe.id}`)
  console.log(`   Title: ${recipe.title}`)
  console.log(`   Category: ${recipe.category.name} (ID: ${recipe.categoryId})`)
  console.log(`   Servings: ${recipe.servings}`)
  console.log(`   Published: ${recipe.published}`)
  console.log(`   Cover Image: ${recipe.coverImage ? '✓' : '✗'}`)
  console.log(`   Ingredients: ${recipe.ingredients.length}`)
  console.log(`   Instructions: ${recipe.instructions.length}`)
  console.log(`   Calories: ${recipe.caloriesPerServing} kcal`)
  console.log(`   Created: ${recipe.createdAt}`)
  console.log(`   Updated: ${recipe.updatedAt}`)

  // List all Frukost recipes
  console.log('\n📋 All Frukost recipes:')
  const frukostCategory = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (frukostCategory) {
    const allFrukostRecipes = await prisma.recipe.findMany({
      where: { categoryId: frukostCategory.id },
      orderBy: { createdAt: 'desc' }
    })

    allFrukostRecipes.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.title} (${r.id})`)
    })
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
