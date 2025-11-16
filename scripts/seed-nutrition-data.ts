import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const proteinCategories = {
  'egg-dairy': {
    name: 'Ägg & Mejeri',
    order: 0,
    items: [
      { name: 'Kaseinpulver (0%)', valuePer100g: 80, order: 0 },
      { name: 'Mjölkproteinpulver (0%)', valuePer100g: 80, order: 1 },
      { name: 'Kvarg (naturell 0%)', valuePer100g: 12, order: 2 },
      { name: 'Keso (0%)', valuePer100g: 11, order: 3 },
      { name: 'Äggvita', valuePer100g: 11, order: 4 },
      { name: 'Ägg (hela)', valuePer100g: 13, order: 5 },
    ],
  },
  'pork': {
    name: 'Fläsk',
    order: 1,
    items: [
      { name: 'Fläskfilé (rå)', valuePer100g: 22, order: 0 },
      { name: 'Fläskkotlett (rå)', valuePer100g: 20, order: 1 },
    ],
  },
  'fish': {
    name: 'Fisk & Skaldjur',
    order: 2,
    items: [
      { name: 'Torsk (rå)', valuePer100g: 18, order: 0 },
      { name: 'Lax (rå)', valuePer100g: 20, order: 1 },
      { name: 'Räkor (kokta)', valuePer100g: 24, order: 2 },
      { name: 'Tonfisk (konserv, vatten)', valuePer100g: 26, order: 3 },
      { name: 'Gös (rå)', valuePer100g: 19, order: 4 },
      { name: 'Abborre (rå)', valuePer100g: 19, order: 5 },
      { name: 'Sej (rå)', valuePer100g: 17, order: 6 },
    ],
  },
  'game': {
    name: 'Viltkött',
    order: 3,
    items: [
      { name: 'Älgkött (rå)', valuePer100g: 22, order: 0 },
      { name: 'Hjortkött (rå)', valuePer100g: 22, order: 1 },
      { name: 'Renkött (rå)', valuePer100g: 22, order: 2 },
    ],
  },
  'beef': {
    name: 'Nötkött',
    order: 4,
    items: [
      { name: 'Nötfärs (5%)', valuePer100g: 20, order: 0 },
      { name: 'Nötfilé (rå)', valuePer100g: 21, order: 1 },
      { name: 'Rostbiff (rå)', valuePer100g: 21, order: 2 },
      { name: 'Oxfilé (rå)', valuePer100g: 21, order: 3 },
    ],
  },
  'poultry': {
    name: 'Fågel',
    order: 5,
    items: [
      { name: 'Kycklingfilé (rå)', valuePer100g: 23, order: 0 },
      { name: 'Kycklingbröst (rå)', valuePer100g: 23, order: 1 },
      { name: 'Kalkonbröst (rå)', valuePer100g: 24, order: 2 },
    ],
  },
  'vegetarian': {
    name: 'Vegetariskt',
    order: 6,
    items: [
      { name: 'Tofu', valuePer100g: 8, order: 0 },
      { name: 'Linser (kokta)', valuePer100g: 9, order: 1 },
      { name: 'Kikärtor (kokta)', valuePer100g: 9, order: 2 },
      { name: 'Jordnötssmör', valuePer100g: 25, order: 3 },
      { name: 'Mandlar', valuePer100g: 21, order: 4 },
      { name: 'Cashewnötter', valuePer100g: 18, order: 5 },
    ],
  },
}

const fatCategories = {
  'nuts': {
    name: 'Nötter',
    order: 0,
    items: [
      { name: 'Hasselnötter', valuePer100g: 61, order: 0 },
      { name: 'Paranötter', valuePer100g: 67, order: 1 },
      { name: 'Pekannötter', valuePer100g: 72, order: 2 },
      { name: 'Cashewnötter', valuePer100g: 44, order: 3 },
      { name: 'Valnötter', valuePer100g: 65, order: 4 },
      { name: 'Mandlar', valuePer100g: 50, order: 5 },
      { name: 'Macadamianötter', valuePer100g: 76, order: 6 },
      { name: 'Jordnötter', valuePer100g: 49, order: 7 },
    ],
  },
  'seeds': {
    name: 'Frön',
    order: 1,
    items: [
      { name: 'Sesamfrö', valuePer100g: 50, order: 0 },
      { name: 'Pumpafrön (skalade)', valuePer100g: 49, order: 1 },
      { name: 'Solrosfrön (skalade)', valuePer100g: 51, order: 2 },
      { name: 'Chiafrön', valuePer100g: 31, order: 3 },
      { name: 'Linfrön', valuePer100g: 42, order: 4 },
    ],
  },
  'oils': {
    name: 'Oljor & Fetter',
    order: 2,
    items: [
      { name: 'Kokosolja', valuePer100g: 100, order: 0 },
      { name: 'Avokadoolja', valuePer100g: 100, order: 1 },
      { name: 'Olivolja', valuePer100g: 100, order: 2 },
      { name: 'Smör', valuePer100g: 81, order: 3 },
      { name: 'Rapsolja', valuePer100g: 100, order: 4 },
    ],
  },
  'spreads': {
    name: 'Pålägg & Övrigt',
    order: 3,
    items: [
      { name: 'Jordnötssmör', valuePer100g: 50, order: 0 },
      { name: 'Mandelsmör', valuePer100g: 55, order: 1 },
      { name: 'Avokado', valuePer100g: 15, order: 2 },
      { name: 'Tahini (sesampasta)', valuePer100g: 54, order: 3 },
    ],
  },
}

const carbsCategories = {
  'grains': {
    name: 'Spannmål & Gröt',
    order: 0,
    items: [
      { name: 'Havregryn (torra)', valuePer100g: 60, order: 0 },
      { name: 'Fullkornsris (kokt)', valuePer100g: 23, order: 1 },
      { name: 'Jasminris (kokt)', valuePer100g: 28, order: 2 },
      { name: 'Quinoa (kokt)', valuePer100g: 21, order: 3 },
      { name: 'Bulgur (kokt)', valuePer100g: 19, order: 4 },
      { name: 'Couscous (kokt)', valuePer100g: 23, order: 5 },
    ],
  },
  'bread': {
    name: 'Bröd & Pasta',
    order: 1,
    items: [
      { name: 'Fullkornspasta (kokt)', valuePer100g: 26, order: 0 },
      { name: 'Pasta (vit, kokt)', valuePer100g: 31, order: 1 },
      { name: 'Fullkornsbröd', valuePer100g: 44, order: 2 },
      { name: 'Knäckebröd (fullkorn)', valuePer100g: 68, order: 3 },
      { name: 'Tortillabröd', valuePer100g: 49, order: 4 },
    ],
  },
  'roots': {
    name: 'Rotfrukter',
    order: 2,
    items: [
      { name: 'Potatis (kokt)', valuePer100g: 17, order: 0 },
      { name: 'Sötpotatis (kokt)', valuePer100g: 20, order: 1 },
      { name: 'Pumpa (kokt)', valuePer100g: 7, order: 2 },
      { name: 'Morot (rå)', valuePer100g: 10, order: 3 },
    ],
  },
  'legumes': {
    name: 'Baljväxter',
    order: 3,
    items: [
      { name: 'Svarta bönor (kokta)', valuePer100g: 24, order: 0 },
      { name: 'Röda linser (kokta)', valuePer100g: 20, order: 1 },
      { name: 'Kikärtor (kokta)', valuePer100g: 27, order: 2 },
      { name: 'Ärtor (gröna, kokta)', valuePer100g: 14, order: 3 },
    ],
  },
  'fruits': {
    name: 'Frukt & Bär',
    order: 4,
    items: [
      { name: 'Banan', valuePer100g: 23, order: 0 },
      { name: 'Äpple', valuePer100g: 14, order: 1 },
      { name: 'Blåbär', valuePer100g: 14, order: 2 },
      { name: 'Dadlar (torkade)', valuePer100g: 75, order: 3 },
      { name: 'Russin', valuePer100g: 79, order: 4 },
      { name: 'Apelsin', valuePer100g: 12, order: 5 },
      { name: 'Jordgubbar', valuePer100g: 8, order: 6 },
    ],
  },
}

async function main() {
  console.log('Starting nutrition data seeding...')

  // Clear existing data
  await prisma.nutritionItem.deleteMany()
  await prisma.nutritionCategory.deleteMany()

  // Seed protein data
  console.log('Seeding protein data...')
  for (const [key, data] of Object.entries(proteinCategories)) {
    const category = await prisma.nutritionCategory.create({
      data: {
        type: 'protein',
        key,
        name: data.name,
        order: data.order,
      },
    })

    for (const item of data.items) {
      await prisma.nutritionItem.create({
        data: {
          categoryId: category.id,
          name: item.name,
          valuePer100g: item.valuePer100g,
          order: item.order,
        },
      })
    }
  }

  // Seed fat data
  console.log('Seeding fat data...')
  for (const [key, data] of Object.entries(fatCategories)) {
    const category = await prisma.nutritionCategory.create({
      data: {
        type: 'fat',
        key,
        name: data.name,
        order: data.order,
      },
    })

    for (const item of data.items) {
      await prisma.nutritionItem.create({
        data: {
          categoryId: category.id,
          name: item.name,
          valuePer100g: item.valuePer100g,
          order: item.order,
        },
      })
    }
  }

  // Seed carbs data
  console.log('Seeding carbs data...')
  for (const [key, data] of Object.entries(carbsCategories)) {
    const category = await prisma.nutritionCategory.create({
      data: {
        type: 'carbs',
        key,
        name: data.name,
        order: data.order,
      },
    })

    for (const item of data.items) {
      await prisma.nutritionItem.create({
        data: {
          categoryId: category.id,
          name: item.name,
          valuePer100g: item.valuePer100g,
          order: item.order,
        },
      })
    }
  }

  console.log('Nutrition data seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
