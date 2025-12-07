import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// SLV Food Database from Livsmedelsverket
// Source: kostschema-generator-v4.jsx
const slvFoodDatabase = [
  // PROTEINKÄLLOR
  { slvNummer: 1534, name: "Kycklingfilé", category: "protein", protein: 23.1, carbs: 0, fat: 1.2, kcal: 106, group: "Kött" },
  { slvNummer: 1535, name: "Kycklingbröst", category: "protein", protein: 22.0, carbs: 0, fat: 2.0, kcal: 110, group: "Kött" },
  { slvNummer: 1536, name: "Kyckling lårfilé", category: "protein", protein: 19.5, carbs: 0, fat: 4.5, kcal: 120, group: "Kött" },
  { slvNummer: 1559, name: "Kalkonfilé", category: "protein", protein: 24.0, carbs: 0, fat: 1.0, kcal: 104, group: "Kött" },
  { slvNummer: 1560, name: "Kalkon färs", category: "protein", protein: 20.0, carbs: 0, fat: 8.0, kcal: 155, group: "Kött" },
  { slvNummer: 1444, name: "Nötfärs 10%", category: "protein", protein: 20.0, carbs: 0, fat: 10.0, kcal: 170, group: "Kött" },
  { slvNummer: 1443, name: "Nötfärs 5%", category: "protein", protein: 21.0, carbs: 0, fat: 5.0, kcal: 130, group: "Kött" },
  { slvNummer: 1457, name: "Nötkött entrecôte", category: "protein", protein: 20.5, carbs: 0, fat: 12.0, kcal: 190, group: "Kött" },
  { slvNummer: 1458, name: "Nötkött innanlår", category: "protein", protein: 22.0, carbs: 0, fat: 3.5, kcal: 120, group: "Kött" },
  { slvNummer: 1495, name: "Fläskfilé", category: "protein", protein: 21.5, carbs: 0, fat: 2.5, kcal: 110, group: "Kött" },
  { slvNummer: 1254, name: "Lax", category: "protein", protein: 20.0, carbs: 0, fat: 11.0, kcal: 180, group: "Fisk" },
  { slvNummer: 1255, name: "Laxfilé", category: "protein", protein: 20.5, carbs: 0, fat: 12.0, kcal: 190, group: "Fisk" },
  { slvNummer: 1316, name: "Torsk", category: "protein", protein: 18.0, carbs: 0, fat: 0.5, kcal: 76, group: "Fisk" },
  { slvNummer: 1317, name: "Torskfilé", category: "protein", protein: 17.5, carbs: 0, fat: 0.4, kcal: 74, group: "Fisk" },
  { slvNummer: 1305, name: "Sej", category: "protein", protein: 19.0, carbs: 0, fat: 0.8, kcal: 82, group: "Fisk" },
  { slvNummer: 1368, name: "Räkor", category: "protein", protein: 20.0, carbs: 0.5, fat: 1.0, kcal: 90, group: "Skaldjur" },
  { slvNummer: 1319, name: "Tonfisk i vatten", category: "protein", protein: 26.0, carbs: 0, fat: 1.0, kcal: 110, group: "Fisk" },
  { slvNummer: 191, name: "Kvarg naturell", category: "protein", protein: 12.0, carbs: 3.5, fat: 0.2, kcal: 64, group: "Mejeri" },
  { slvNummer: 192, name: "Kvarg vanilj", category: "protein", protein: 10.5, carbs: 5.0, fat: 0.2, kcal: 65, group: "Mejeri" },
  { slvNummer: 184, name: "Keso naturell", category: "protein", protein: 13.0, carbs: 2.5, fat: 4.0, kcal: 98, group: "Mejeri" },
  { slvNummer: 185, name: "Keso max 1.5% fett", category: "protein", protein: 12.5, carbs: 3.0, fat: 1.5, kcal: 75, group: "Mejeri" },
  { slvNummer: 160, name: "Grekisk yoghurt 0%", category: "protein", protein: 10.0, carbs: 4.0, fat: 0, kcal: 57, group: "Mejeri" },
  { slvNummer: 161, name: "Grekisk yoghurt 2%", category: "protein", protein: 9.0, carbs: 4.0, fat: 2.0, kcal: 70, group: "Mejeri" },
  { slvNummer: 162, name: "Grekisk yoghurt 10%", category: "protein", protein: 5.0, carbs: 4.0, fat: 10.0, kcal: 130, group: "Mejeri" },
  { slvNummer: 340, name: "Ägg (hela)", category: "protein", protein: 12.5, carbs: 0.5, fat: 10.0, kcal: 143, group: "Ägg" },
  { slvNummer: 341, name: "Äggvita", category: "protein", protein: 11.0, carbs: 0.5, fat: 0, kcal: 47, group: "Ägg" },
  { slvNummer: 2368, name: "Whey proteinpulver", category: "protein", protein: 80.0, carbs: 5.0, fat: 3.0, kcal: 370, group: "Kosttillskott" },
  { slvNummer: 2369, name: "Casein proteinpulver", category: "protein", protein: 75.0, carbs: 6.0, fat: 2.0, kcal: 350, group: "Kosttillskott" },
  { slvNummer: 872, name: "Tofu naturell", category: "protein", protein: 15.0, carbs: 1.5, fat: 9.0, kcal: 145, group: "Vegetariskt" },
  { slvNummer: 873, name: "Tempeh", category: "protein", protein: 19.0, carbs: 7.5, fat: 11.0, kcal: 200, group: "Vegetariskt" },
  { slvNummer: 183, name: "Cottage cheese", category: "protein", protein: 11.0, carbs: 3.0, fat: 4.5, kcal: 98, group: "Mejeri" },

  // KOLHYDRATSKÄLLOR
  { slvNummer: 519, name: "Havregryn", category: "kolhydrat", protein: 13.0, carbs: 58.0, fat: 7.0, kcal: 365, group: "Spannmål" },
  { slvNummer: 520, name: "Havregryn glutenfria", category: "kolhydrat", protein: 12.5, carbs: 60.0, fat: 6.5, kcal: 360, group: "Spannmål" },
  { slvNummer: 558, name: "Ris vitt (okokt)", category: "kolhydrat", protein: 7.0, carbs: 78.0, fat: 0.5, kcal: 350, group: "Spannmål" },
  { slvNummer: 559, name: "Ris brunt (okokt)", category: "kolhydrat", protein: 7.5, carbs: 74.0, fat: 2.5, kcal: 355, group: "Spannmål" },
  { slvNummer: 560, name: "Ris jasmin (okokt)", category: "kolhydrat", protein: 7.0, carbs: 79.0, fat: 0.4, kcal: 352, group: "Spannmål" },
  { slvNummer: 561, name: "Ris basmati (okokt)", category: "kolhydrat", protein: 8.0, carbs: 77.0, fat: 0.5, kcal: 350, group: "Spannmål" },
  { slvNummer: 688, name: "Potatis", category: "kolhydrat", protein: 2.0, carbs: 17.0, fat: 0.1, kcal: 77, group: "Rotfrukter" },
  { slvNummer: 689, name: "Potatis kokt", category: "kolhydrat", protein: 1.8, carbs: 15.0, fat: 0.1, kcal: 68, group: "Rotfrukter" },
  { slvNummer: 690, name: "Sötpotatis", category: "kolhydrat", protein: 1.5, carbs: 20.0, fat: 0.1, kcal: 86, group: "Rotfrukter" },
  { slvNummer: 547, name: "Pasta (okokt)", category: "kolhydrat", protein: 12.0, carbs: 71.0, fat: 1.5, kcal: 350, group: "Spannmål" },
  { slvNummer: 548, name: "Pasta fullkorn (okokt)", category: "kolhydrat", protein: 13.0, carbs: 65.0, fat: 2.5, kcal: 340, group: "Spannmål" },
  { slvNummer: 2392, name: "Bönpasta (okokt)", category: "kolhydrat", protein: 22.0, carbs: 45.0, fat: 2.0, kcal: 290, group: "Baljväxter" },
  { slvNummer: 2393, name: "Linserpasta (okokt)", category: "kolhydrat", protein: 25.0, carbs: 42.0, fat: 1.5, kcal: 285, group: "Baljväxter" },
  { slvNummer: 512, name: "Couscous (okokt)", category: "kolhydrat", protein: 12.5, carbs: 72.0, fat: 0.6, kcal: 350, group: "Spannmål" },
  { slvNummer: 508, name: "Bulgur (okokt)", category: "kolhydrat", protein: 12.0, carbs: 68.0, fat: 1.5, kcal: 340, group: "Spannmål" },
  { slvNummer: 554, name: "Quinoa (okokt)", category: "kolhydrat", protein: 14.0, carbs: 64.0, fat: 6.0, kcal: 370, group: "Spannmål" },
  { slvNummer: 544, name: "Matvete (okokt)", category: "kolhydrat", protein: 13.0, carbs: 62.0, fat: 2.0, kcal: 325, group: "Spannmål" },
  { slvNummer: 496, name: "Bröd fullkorn", category: "kolhydrat", protein: 9.0, carbs: 42.0, fat: 3.5, kcal: 240, group: "Bröd" },
  { slvNummer: 490, name: "Knäckebröd", category: "kolhydrat", protein: 10.0, carbs: 65.0, fat: 2.0, kcal: 320, group: "Bröd" },
  { slvNummer: 156, name: "Naturell yoghurt 0.5%", category: "kolhydrat", protein: 5.0, carbs: 6.0, fat: 0.5, kcal: 48, group: "Mejeri" },
  { slvNummer: 157, name: "Naturell yoghurt 3%", category: "kolhydrat", protein: 4.5, carbs: 5.5, fat: 3.0, kcal: 68, group: "Mejeri" },
  { slvNummer: 858, name: "Kikärtor (kokta)", category: "kolhydrat", protein: 8.0, carbs: 18.0, fat: 2.5, kcal: 130, group: "Baljväxter" },
  { slvNummer: 864, name: "Svarta bönor (kokta)", category: "kolhydrat", protein: 8.5, carbs: 16.0, fat: 0.5, kcal: 105, group: "Baljväxter" },
  { slvNummer: 860, name: "Kidneybönor (kokta)", category: "kolhydrat", protein: 8.0, carbs: 17.0, fat: 0.5, kcal: 105, group: "Baljväxter" },
  { slvNummer: 861, name: "Linser (kokta)", category: "kolhydrat", protein: 9.0, carbs: 15.0, fat: 0.4, kcal: 100, group: "Baljväxter" },
  { slvNummer: 608, name: "Banan", category: "kolhydrat", protein: 1.0, carbs: 20.0, fat: 0.3, kcal: 90, group: "Frukt" },
  { slvNummer: 538, name: "Müsli utan tillsatt socker", category: "kolhydrat", protein: 10.0, carbs: 58.0, fat: 8.0, kcal: 355, group: "Spannmål" },
  { slvNummer: 635, name: "Blåbär", category: "kolhydrat", protein: 0.7, carbs: 12.0, fat: 0.3, kcal: 55, group: "Bär" },
  { slvNummer: 636, name: "Hallon", category: "kolhydrat", protein: 1.2, carbs: 5.0, fat: 0.6, kcal: 32, group: "Bär" },
  { slvNummer: 637, name: "Jordgubbar", category: "kolhydrat", protein: 0.7, carbs: 6.0, fat: 0.3, kcal: 30, group: "Bär" },

  // FETTKÄLLOR
  { slvNummer: 602, name: "Avokado", category: "fett", protein: 2.0, carbs: 2.0, fat: 20.0, kcal: 190, group: "Frukt" },
  { slvNummer: 815, name: "Mandlar", category: "fett", protein: 21.0, carbs: 6.0, fat: 55.0, kcal: 600, group: "Nötter" },
  { slvNummer: 827, name: "Valnötter", category: "fett", protein: 15.0, carbs: 7.0, fat: 65.0, kcal: 650, group: "Nötter" },
  { slvNummer: 811, name: "Cashewnötter", category: "fett", protein: 18.0, carbs: 27.0, fat: 44.0, kcal: 570, group: "Nötter" },
  { slvNummer: 813, name: "Hasselnötter", category: "fett", protein: 15.0, carbs: 6.0, fat: 61.0, kcal: 630, group: "Nötter" },
  { slvNummer: 814, name: "Jordnötter", category: "fett", protein: 26.0, carbs: 12.0, fat: 49.0, kcal: 580, group: "Nötter" },
  { slvNummer: 816, name: "Macadamianötter", category: "fett", protein: 8.0, carbs: 5.0, fat: 76.0, kcal: 720, group: "Nötter" },
  { slvNummer: 820, name: "Pekannötter", category: "fett", protein: 9.0, carbs: 4.0, fat: 72.0, kcal: 690, group: "Nötter" },
  { slvNummer: 819, name: "Blandade nötter", category: "fett", protein: 20.0, carbs: 10.0, fat: 55.0, kcal: 600, group: "Nötter" },
  { slvNummer: 405, name: "Olivolja", category: "fett", protein: 0, carbs: 0, fat: 100.0, kcal: 880, group: "Oljor" },
  { slvNummer: 399, name: "Kokosolja", category: "fett", protein: 0, carbs: 0, fat: 100.0, kcal: 880, group: "Oljor" },
  { slvNummer: 408, name: "Rapsolja", category: "fett", protein: 0, carbs: 0, fat: 100.0, kcal: 880, group: "Oljor" },
  { slvNummer: 380, name: "Smör", category: "fett", protein: 0.5, carbs: 0.5, fat: 82.0, kcal: 740, group: "Mejeri" },
  { slvNummer: 829, name: "Chifrön", category: "fett", protein: 17.0, carbs: 8.0, fat: 31.0, kcal: 400, group: "Frön" },
  { slvNummer: 831, name: "Linfrön", category: "fett", protein: 18.0, carbs: 3.0, fat: 42.0, kcal: 450, group: "Frön" },
  { slvNummer: 835, name: "Pumpafrön", category: "fett", protein: 30.0, carbs: 5.0, fat: 49.0, kcal: 560, group: "Frön" },
  { slvNummer: 836, name: "Solrosfrön", category: "fett", protein: 21.0, carbs: 15.0, fat: 51.0, kcal: 580, group: "Frön" },
  { slvNummer: 822, name: "Jordnötssmör naturell", category: "fett", protein: 25.0, carbs: 12.0, fat: 50.0, kcal: 590, group: "Nötter" },
  { slvNummer: 817, name: "Mandelsmör", category: "fett", protein: 21.0, carbs: 7.0, fat: 56.0, kcal: 610, group: "Nötter" },

  // GRÖNSAKER
  { slvNummer: 656, name: "Broccoli", category: "grönsak", protein: 3.0, carbs: 4.0, fat: 0.4, kcal: 30, group: "Grönsaker" },
  { slvNummer: 697, name: "Spenat", category: "grönsak", protein: 2.5, carbs: 1.5, fat: 0.3, kcal: 20, group: "Grönsaker" },
  { slvNummer: 703, name: "Blandade grönsaker", category: "grönsak", protein: 3.5, carbs: 5.0, fat: 0.3, kcal: 35, group: "Grönsaker" },
  { slvNummer: 687, name: "Paprika", category: "grönsak", protein: 1.0, carbs: 5.0, fat: 0.2, kcal: 25, group: "Grönsaker" },
  { slvNummer: 699, name: "Tomat", category: "grönsak", protein: 0.9, carbs: 3.0, fat: 0.2, kcal: 18, group: "Grönsaker" },
  { slvNummer: 669, name: "Gurka", category: "grönsak", protein: 0.6, carbs: 2.0, fat: 0.1, kcal: 12, group: "Grönsaker" },
  { slvNummer: 682, name: "Morot", category: "grönsak", protein: 0.9, carbs: 7.0, fat: 0.2, kcal: 33, group: "Grönsaker" },
  { slvNummer: 706, name: "Zucchini", category: "grönsak", protein: 1.2, carbs: 2.0, fat: 0.2, kcal: 15, group: "Grönsaker" },
  { slvNummer: 655, name: "Blomkål", category: "grönsak", protein: 2.0, carbs: 3.0, fat: 0.3, kcal: 23, group: "Grönsaker" },
  { slvNummer: 696, name: "Sparris", category: "grönsak", protein: 2.2, carbs: 2.0, fat: 0.2, kcal: 18, group: "Grönsaker" },
  { slvNummer: 670, name: "Haricots verts", category: "grönsak", protein: 1.8, carbs: 4.0, fat: 0.1, kcal: 25, group: "Grönsaker" },
  { slvNummer: 716, name: "Champinjoner", category: "grönsak", protein: 3.0, carbs: 0.5, fat: 0.3, kcal: 15, group: "Grönsaker" },
]

// Map category to FoodCategory
const categoryMapping: Record<string, string> = {
  'protein': 'Proteinkälla',
  'kolhydrat': 'Kolhydratkälla',
  'fett': 'Fettkälla',
  'grönsak': 'Grönsaker'
}

async function main() {
  console.log('Starting SLV food items seed...')

  // Get existing food categories
  const foodCategories = await prisma.foodCategory.findMany()
  const categoryMap = new Map(foodCategories.map(c => [c.name, c.id]))

  let created = 0
  let updated = 0
  let skipped = 0

  for (const food of slvFoodDatabase) {
    const categoryName = categoryMapping[food.category]
    const categoryId = categoryMap.get(categoryName)

    // Try to find existing item by SLV nummer
    const existingBySlv = await prisma.foodItem.findFirst({
      where: { slvNummer: food.slvNummer }
    })

    // Try to find existing item by similar name
    const existingByName = await prisma.foodItem.findFirst({
      where: {
        name: {
          contains: food.name.split(' ')[0], // Match first word
          mode: 'insensitive'
        }
      }
    })

    if (existingBySlv) {
      // Update existing item with SLV data
      await prisma.foodItem.update({
        where: { id: existingBySlv.id },
        data: {
          slvNummer: food.slvNummer,
          slvNamn: food.name,
          foodGroup: food.group,
          proteinG: food.protein,
          carbsG: food.carbs,
          fatG: food.fat,
          calories: food.kcal,
          categoryId: categoryId || existingBySlv.categoryId,
          isApproved: true
        }
      })
      updated++
      console.log(`Updated: ${food.name} (SLV #${food.slvNummer})`)
    } else if (existingByName) {
      // Update matching item with SLV nummer
      await prisma.foodItem.update({
        where: { id: existingByName.id },
        data: {
          slvNummer: food.slvNummer,
          slvNamn: food.name,
          foodGroup: food.group,
        }
      })
      updated++
      console.log(`Linked: ${existingByName.name} -> SLV #${food.slvNummer}`)
    } else {
      // Create new food item
      await prisma.foodItem.create({
        data: {
          name: food.name,
          slvNummer: food.slvNummer,
          slvNamn: food.name,
          foodGroup: food.group,
          proteinG: food.protein,
          carbsG: food.carbs,
          fatG: food.fat,
          calories: food.kcal,
          categoryId: categoryId,
          isApproved: true,
          isRecommended: true,
          commonServingSize: '100g'
        }
      })
      created++
      console.log(`Created: ${food.name} (SLV #${food.slvNummer})`)
    }
  }

  console.log('\n=== Summary ===')
  console.log(`Created: ${created}`)
  console.log(`Updated: ${updated}`)
  console.log(`Total SLV items: ${slvFoodDatabase.length}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
