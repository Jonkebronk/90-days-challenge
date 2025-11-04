const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Setting up article categories...')

  // Define the new categories
  const categories = [
    {
      name: 'INLEDNING',
      slug: 'inledning',
      description: 'Inledande artiklar för att komma igång',
      orderIndex: 1
    },
    {
      name: 'INNAN DU BÖRJAR',
      slug: 'innan-du-borjar',
      description: 'Viktiga artiklar att läsa innan du startar din resa',
      orderIndex: 2
    },
    {
      name: 'FÖRSTA FASEN: BYGG GRUNDEN',
      slug: 'forsta-fasen-bygg-grunden',
      description: 'Dag 1-30: Grundläggande vanor och kunskap',
      orderIndex: 3
    },
    {
      name: 'ANDRA FASEN: VÄXLA UPP',
      slug: 'andra-fasen-vaxla-upp',
      description: 'Dag 31-60: Intensifiering och fördjupning',
      orderIndex: 4
    },
    {
      name: 'TREDJE FASEN: SISTA PUSHEN',
      slug: 'tredje-fasen-sista-pushen',
      description: 'Dag 61-90: Finslipning och målgång',
      orderIndex: 5
    },
    {
      name: 'NÄR DU ÄR I MÅL',
      slug: 'nar-du-ar-i-mal',
      description: 'Artiklar för underhåll och fortsatt framgång',
      orderIndex: 6
    }
  ]

  // Check existing categories
  const existingCategories = await prisma.articleCategory.findMany()

  if (existingCategories.length > 0) {
    console.log('\nExisting categories found:')
    existingCategories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.slug})`)
    })

    console.log('\nNote: This will create new categories alongside existing ones.')
    console.log('To remove old categories, delete them manually in Prisma Studio or update this script.\n')
  }

  // Create new categories
  for (const category of categories) {
    try {
      const existing = await prisma.articleCategory.findUnique({
        where: { slug: category.slug }
      })

      if (existing) {
        console.log(`✓ Category "${category.name}" already exists`)
      } else {
        await prisma.articleCategory.create({
          data: category
        })
        console.log(`✓ Created category: ${category.name}`)
      }
    } catch (error) {
      console.error(`✗ Failed to create ${category.name}:`, error.message)
    }
  }

  console.log('\n✅ Article categories setup complete!')
  console.log('\nYou can now:')
  console.log('1. Open Prisma Studio to view/manage categories: npx prisma studio')
  console.log('2. Delete old categories if needed')
  console.log('3. Start creating articles in these new categories')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
