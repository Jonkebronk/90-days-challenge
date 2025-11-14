import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const categories = [
  {
    name: 'Frukost',
    slug: 'frukost',
    description: 'Recept för frukost',
    orderIndex: 1,
  },
  {
    name: 'Lunch',
    slug: 'lunch',
    description: 'Recept för lunch',
    orderIndex: 2,
  },
  {
    name: 'Middag',
    slug: 'middag',
    description: 'Recept för middag',
    orderIndex: 3,
  },
  {
    name: 'Kvällsmål',
    slug: 'kvallsmal',
    description: 'Recept för kvällsmål',
    orderIndex: 4,
  },
  {
    name: 'Mellanmål',
    slug: 'mellanmal',
    description: 'Recept för mellanmål',
    orderIndex: 5,
  },
]

async function main() {
  console.log('Adding recipe categories...')

  for (const category of categories) {
    const existing = await prisma.recipeCategory.findUnique({
      where: { slug: category.slug },
    })

    if (existing) {
      console.log(`Category "${category.name}" already exists, skipping...`)
    } else {
      await prisma.recipeCategory.create({
        data: category,
      })
      console.log(`Created category: ${category.name}`)
    }
  }

  console.log('Done!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
