import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const recipe = await prisma.recipe.update({
    where: { id: 'cmi061wk10004vkaw1eq3t8r1' },
    data: {
      coverImage: 'https://i.postimg.cc/WpJJ7z9z/2025-11-15-11-49-45-NVIDIA-Ge-Force-Overlay-DT.png'
    }
  })
  console.log(`✅ Updated ${recipe.title} with cover image`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
