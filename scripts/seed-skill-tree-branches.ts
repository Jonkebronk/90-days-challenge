import { prisma } from '../lib/prisma'

async function seedBranches() {
  // Check if branches already exist
  const existing = await prisma.skillTreeBranch.count()
  if (existing > 0) {
    console.log('Branches already exist, skipping seed')
    return
  }

  const branches = [
    {
      name: 'Livsstil',
      icon: 'Heart',
      color: '#A855F7',
      categorySlugs: ['kropp-sinne', 'livsstil', 'framgangsrik-livsstilsforandring'],
      orderIndex: 0
    },
    {
      name: 'Kost',
      icon: 'Leaf',
      color: '#22C55E',
      categorySlugs: ['kost', 'din-guide-till-ratt-naring'],
      orderIndex: 1
    },
    {
      name: 'Träning',
      icon: 'Dumbbell',
      color: '#F97316',
      categorySlugs: ['traning', 'ovningar'],
      orderIndex: 2
    }
  ]

  for (const branch of branches) {
    await prisma.skillTreeBranch.create({ data: branch })
    console.log('Created branch:', branch.name)
  }

  console.log('Done!')
}

seedBranches()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
