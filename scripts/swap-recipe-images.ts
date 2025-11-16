import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Update Smaskigt räkris with the image
  await prisma.recipe.update({
    where: { id: 'cmi063edq0003vke0oc81936q' }, // Smaskigt räkris
    data: {
      coverImage: 'https://i.postimg.cc/WpJJ7z9z/2025-11-15-11-49-45-NVIDIA-Ge-Force-Overlay-DT.png'
    }
  })
  console.log('✅ Updated Smaskigt räkris with cover image')

  // Remove image from Het Piri Piri räkwok
  await prisma.recipe.update({
    where: { id: 'cmi061wk10004vkaw1eq3t8r1' }, // Het Piri Piri räkwok
    data: {
      coverImage: ''
    }
  })
  console.log('✅ Removed cover image from Het Piri Piri räkwok')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
