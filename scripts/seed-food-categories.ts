import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const categories = [
  {
    name: 'Proteinkälla',
    slug: 'proteinkalla',
    description: 'Proteinrika livsmedel för muskelbygge och återhämtning',
    color: '#FF6B6B', // Red
    icon: 'Beef',
    orderIndex: 1,
  },
  {
    name: 'Kolhydratkälla',
    slug: 'kolhydratkalla',
    description: 'Energigivande kolhydrater för träning och vardagen',
    color: '#4ECDC4', // Cyan
    icon: 'Wheat',
    orderIndex: 2,
  },
  {
    name: 'Fettkälla',
    slug: 'fettkalla',
    description: 'Nyttiga fetter för hormonbalans och hälsa',
    color: '#FFD93D', // Yellow
    icon: 'Droplet',
    orderIndex: 3,
  },
  {
    name: 'Grönsaker',
    slug: 'gronsaker',
    description: 'Vitaminer, mineraler och fiber',
    color: '#6BCF7F', // Green
    icon: 'Carrot',
    orderIndex: 4,
  },
]

async function main() {
  console.log('🌱 Seeding food categories...\n')

  for (const category of categories) {
    const existing = await prisma.foodCategory.findUnique({
      where: { slug: category.slug },
    })

    if (existing) {
      console.log(`✓ Category already exists: ${category.name}`)
      continue
    }

    const created = await prisma.foodCategory.create({
      data: category,
    })

    console.log(`✅ Created category: ${created.name} (${created.slug})`)
  }

  console.log('\n✨ Food categories seeded successfully!')

  // Show current categories
  const allCategories = await prisma.foodCategory.findMany({
    orderBy: { orderIndex: 'asc' },
    include: {
      _count: {
        select: { foodItems: true },
      },
    },
  })

  console.log('\n📊 Current food categories:')
  allCategories.forEach((cat) => {
    console.log(
      `   ${cat.name} (${cat.slug}) - ${cat._count.foodItems} items - ${cat.color}`
    )
  })
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
