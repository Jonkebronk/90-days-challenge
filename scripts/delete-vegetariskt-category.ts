import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteCategories() {
  try {
    const categoriesToDelete = ['Vegetariskt', 'Pålägg & Övrigt']

    for (const categoryName of categoriesToDelete) {
      console.log(`\n🔍 Searching for "${categoryName}" category...`)

      // Find the category
      const category = await prisma.nutritionCategory.findFirst({
        where: {
          name: categoryName
        },
        include: {
          items: true
        }
      })

      if (!category) {
        console.log(`❌ No "${categoryName}" category found`)
        continue
      }

      console.log(`✅ Found category: ${category.name}`)
      console.log(`   - Type: ${category.type}`)
      console.log(`   - Items: ${category.items.length}`)
      console.log(`   - ID: ${category.id}`)

      // Delete all items first (cascade should handle this, but being explicit)
      if (category.items.length > 0) {
        console.log(`🗑️  Deleting ${category.items.length} items...`)
        await prisma.nutritionItem.deleteMany({
          where: {
            categoryId: category.id
          }
        })
        console.log('✅ Items deleted')
      }

      // Delete the category
      console.log('🗑️  Deleting category...')
      await prisma.nutritionCategory.delete({
        where: {
          id: category.id
        }
      })

      console.log(`✅ Successfully deleted "${categoryName}" category!`)
    }

    console.log('\n🎉 All categories deleted successfully!')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

deleteCategories()
