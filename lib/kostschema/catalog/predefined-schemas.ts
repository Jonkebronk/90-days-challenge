import { CatalogCategory, CatalogSchema } from './types'

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  {
    id: 'blandat',
    name: 'Blandat kost',
    description: 'Varierad kost med alla proteinkällor'
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Klassiska scheman för allmän hälsa'
  },
  {
    id: 'vegetariskt',
    name: 'Vegetariskt',
    description: 'Utan kött och fisk'
  },
  {
    id: 'low-carb',
    name: 'Lågkolhydrat',
    description: 'Reducerade kolhydrater, högre fett'
  },
  {
    id: 'high-protein',
    name: 'Högprotein',
    description: 'Extra protein för muskelbygge'
  }
]

export const CATALOG_SCHEMAS: CatalogSchema[] = [
  // BLANDAT KOST - 1600 kcal
  {
    id: 'blandat-1600',
    name: 'Blandat kost 1600 kcal',
    categoryId: 'blandat',
    calorieLevel: 1600,
    description: 'Balanserat schema för måttlig viktnedgång',
    totals: { protein: 130, carbs: 150, fat: 55, kcal: 1600 },
    meals: [
      {
        id: 'b1600-frukost',
        name: 'Frukost',
        time: '07:00',
        totalProtein: 28, totalCarbs: 35, totalFat: 10, totalKcal: 340,
        foods: [
          { name: 'Havregryn', amountG: 50, protein: 6, carbs: 30, fat: 3.5, kcal: 185, category: 'kolhydrat' },
          { name: 'Kvarg naturell', amountG: 150, protein: 18, carbs: 5, fat: 0.3, kcal: 96, category: 'protein' },
          { name: 'Blåbär', amountG: 50, protein: 0.4, carbs: 6, fat: 0.2, kcal: 29, category: 'kolhydrat' },
          { name: 'Valnötter', amountG: 10, protein: 1.5, carbs: 0.7, fat: 6.5, kcal: 65, category: 'fett' }
        ]
      },
      {
        id: 'b1600-lunch',
        name: 'Lunch',
        time: '12:00',
        totalProtein: 38, totalCarbs: 45, totalFat: 15, totalKcal: 465,
        foods: [
          { name: 'Kycklingfilé', amountG: 150, protein: 34, carbs: 0, fat: 3.5, kcal: 165, category: 'protein' },
          { name: 'Jasminris (kokt)', amountG: 150, protein: 4, carbs: 42, fat: 0.4, kcal: 195, category: 'kolhydrat' },
          { name: 'Broccoli', amountG: 100, protein: 2.8, carbs: 4, fat: 0.4, kcal: 34, category: 'grönsak' },
          { name: 'Olivolja', amountG: 10, protein: 0, carbs: 0, fat: 10, kcal: 88, category: 'fett' }
        ]
      },
      {
        id: 'b1600-mellanmal',
        name: 'Mellanmål',
        time: '15:00',
        totalProtein: 20, totalCarbs: 25, totalFat: 8, totalKcal: 250,
        foods: [
          { name: 'Grekisk yoghurt 2%', amountG: 150, protein: 15, carbs: 6, fat: 3, kcal: 111, category: 'protein' },
          { name: 'Banan', amountG: 100, protein: 1, carbs: 20, fat: 0.3, kcal: 89, category: 'kolhydrat' },
          { name: 'Mandlar', amountG: 10, protein: 2, carbs: 1, fat: 5, kcal: 58, category: 'fett' }
        ]
      },
      {
        id: 'b1600-middag',
        name: 'Middag',
        time: '18:00',
        totalProtein: 35, totalCarbs: 35, totalFat: 18, totalKcal: 440,
        foods: [
          { name: 'Laxfilé', amountG: 125, protein: 25, carbs: 0, fat: 16, kcal: 248, category: 'protein' },
          { name: 'Potatis (kokt)', amountG: 150, protein: 3, carbs: 26, fat: 0.1, kcal: 116, category: 'kolhydrat' },
          { name: 'Sparris', amountG: 100, protein: 2.2, carbs: 3.9, fat: 0.1, kcal: 20, category: 'grönsak' },
          { name: 'Citron & dill', amountG: 15, protein: 0, carbs: 1, fat: 0, kcal: 4, category: 'grönsak' }
        ]
      },
      {
        id: 'b1600-kvallsmal',
        name: 'Kvällsmål',
        time: '21:00',
        totalProtein: 9, totalCarbs: 10, totalFat: 4, totalKcal: 105,
        foods: [
          { name: 'Keso', amountG: 100, protein: 12, carbs: 3, fat: 4, kcal: 98, category: 'protein' }
        ]
      }
    ]
  },

  // BLANDAT KOST - 1800 kcal
  {
    id: 'blandat-1800',
    name: 'Blandat kost 1800 kcal',
    categoryId: 'blandat',
    calorieLevel: 1800,
    description: 'Balanserat schema för underhåll eller lätt viktminskning',
    totals: { protein: 145, carbs: 170, fat: 60, kcal: 1800 },
    meals: [
      {
        id: 'b1800-frukost',
        name: 'Frukost',
        time: '07:00',
        totalProtein: 32, totalCarbs: 40, totalFat: 12, totalKcal: 395,
        foods: [
          { name: 'Havregryn', amountG: 60, protein: 7, carbs: 36, fat: 4, kcal: 222, category: 'kolhydrat' },
          { name: 'Kvarg naturell', amountG: 175, protein: 21, carbs: 6, fat: 0.4, kcal: 112, category: 'protein' },
          { name: 'Hallon', amountG: 60, protein: 0.7, carbs: 4, fat: 0.4, kcal: 22, category: 'kolhydrat' },
          { name: 'Valnötter', amountG: 12, protein: 1.8, carbs: 0.8, fat: 7.8, kcal: 78, category: 'fett' }
        ]
      },
      {
        id: 'b1800-lunch',
        name: 'Lunch',
        time: '12:00',
        totalProtein: 42, totalCarbs: 50, totalFat: 16, totalKcal: 510,
        foods: [
          { name: 'Kycklingfilé', amountG: 170, protein: 38, carbs: 0, fat: 4, kcal: 187, category: 'protein' },
          { name: 'Jasminris (kokt)', amountG: 175, protein: 4.5, carbs: 49, fat: 0.5, kcal: 227, category: 'kolhydrat' },
          { name: 'Wokgrönsaker', amountG: 120, protein: 2.5, carbs: 6, fat: 0.3, kcal: 36, category: 'grönsak' },
          { name: 'Olivolja', amountG: 10, protein: 0, carbs: 0, fat: 10, kcal: 88, category: 'fett' }
        ]
      },
      {
        id: 'b1800-mellanmal',
        name: 'Mellanmål',
        time: '15:00',
        totalProtein: 22, totalCarbs: 28, totalFat: 10, totalKcal: 285,
        foods: [
          { name: 'Grekisk yoghurt 2%', amountG: 175, protein: 17.5, carbs: 7, fat: 3.5, kcal: 130, category: 'protein' },
          { name: 'Banan', amountG: 110, protein: 1.2, carbs: 22, fat: 0.3, kcal: 98, category: 'kolhydrat' },
          { name: 'Mandlar', amountG: 12, protein: 2.5, carbs: 1.2, fat: 6, kcal: 70, category: 'fett' }
        ]
      },
      {
        id: 'b1800-middag',
        name: 'Middag',
        time: '18:00',
        totalProtein: 38, totalCarbs: 40, totalFat: 18, totalKcal: 480,
        foods: [
          { name: 'Laxfilé', amountG: 140, protein: 28, carbs: 0, fat: 18, kcal: 280, category: 'protein' },
          { name: 'Sötpotatis (kokt)', amountG: 175, protein: 2.8, carbs: 35, fat: 0.1, kcal: 158, category: 'kolhydrat' },
          { name: 'Haricots verts', amountG: 100, protein: 1.8, carbs: 5, fat: 0.1, kcal: 31, category: 'grönsak' },
          { name: 'Citron', amountG: 10, protein: 0, carbs: 0.9, fat: 0, kcal: 3, category: 'grönsak' }
        ]
      },
      {
        id: 'b1800-kvallsmal',
        name: 'Kvällsmål',
        time: '21:00',
        totalProtein: 11, totalCarbs: 12, totalFat: 4, totalKcal: 130,
        foods: [
          { name: 'Keso', amountG: 125, protein: 15, carbs: 3.8, fat: 5, kcal: 122, category: 'protein' }
        ]
      }
    ]
  },

  // BLANDAT KOST - 2000 kcal
  {
    id: 'blandat-2000',
    name: 'Blandat kost 2000 kcal',
    categoryId: 'blandat',
    calorieLevel: 2000,
    description: 'Balanserat underhållsschema',
    totals: { protein: 160, carbs: 190, fat: 65, kcal: 2000 },
    meals: [
      {
        id: 'b2000-frukost',
        name: 'Frukost',
        time: '07:00',
        totalProtein: 35, totalCarbs: 45, totalFat: 14, totalKcal: 445,
        foods: [
          { name: 'Havregryn', amountG: 70, protein: 8.4, carbs: 42, fat: 4.9, kcal: 259, category: 'kolhydrat' },
          { name: 'Kvarg vanilj', amountG: 200, protein: 20, carbs: 8, fat: 0.4, kcal: 116, category: 'protein' },
          { name: 'Jordgubbar', amountG: 80, protein: 0.6, carbs: 5.6, fat: 0.3, kcal: 26, category: 'kolhydrat' },
          { name: 'Valnötter', amountG: 15, protein: 2.3, carbs: 1, fat: 9.8, kcal: 98, category: 'fett' }
        ]
      },
      {
        id: 'b2000-lunch',
        name: 'Lunch',
        time: '12:00',
        totalProtein: 45, totalCarbs: 55, totalFat: 18, totalKcal: 560,
        foods: [
          { name: 'Fläskfilé', amountG: 175, protein: 38, carbs: 0, fat: 5, kcal: 193, category: 'protein' },
          { name: 'Basmatiris (kokt)', amountG: 200, protein: 5, carbs: 56, fat: 0.6, kcal: 260, category: 'kolhydrat' },
          { name: 'Paprika mix', amountG: 100, protein: 1, carbs: 4.6, fat: 0.2, kcal: 26, category: 'grönsak' },
          { name: 'Rapsolja', amountG: 12, protein: 0, carbs: 0, fat: 12, kcal: 106, category: 'fett' }
        ]
      },
      {
        id: 'b2000-mellanmal',
        name: 'Mellanmål',
        time: '15:00',
        totalProtein: 25, totalCarbs: 32, totalFat: 10, totalKcal: 315,
        foods: [
          { name: 'Proteinpudding', amountG: 200, protein: 20, carbs: 12, fat: 3, kcal: 156, category: 'protein' },
          { name: 'Banan', amountG: 120, protein: 1.3, carbs: 24, fat: 0.4, kcal: 107, category: 'kolhydrat' },
          { name: 'Jordnötssmör', amountG: 12, protein: 3, carbs: 2, fat: 6, kcal: 72, category: 'fett' }
        ]
      },
      {
        id: 'b2000-middag',
        name: 'Middag',
        time: '18:00',
        totalProtein: 42, totalCarbs: 45, totalFat: 19, totalKcal: 520,
        foods: [
          { name: 'Nötfärs 10%', amountG: 150, protein: 30, carbs: 0, fat: 15, kcal: 255, category: 'protein' },
          { name: 'Pasta (kokt)', amountG: 175, protein: 6, carbs: 43, fat: 1, kcal: 219, category: 'kolhydrat' },
          { name: 'Tomatsås', amountG: 100, protein: 1.5, carbs: 8, fat: 0.2, kcal: 40, category: 'grönsak' },
          { name: 'Parmesan', amountG: 10, protein: 4, carbs: 0, fat: 3, kcal: 43, category: 'fett' }
        ]
      },
      {
        id: 'b2000-kvallsmal',
        name: 'Kvällsmål',
        time: '21:00',
        totalProtein: 13, totalCarbs: 13, totalFat: 4, totalKcal: 160,
        foods: [
          { name: 'Keso naturell', amountG: 150, protein: 18, carbs: 4.5, fat: 6, kcal: 147, category: 'protein' }
        ]
      }
    ]
  },

  // BLANDAT KOST - 2200 kcal
  {
    id: 'blandat-2200',
    name: 'Blandat kost 2200 kcal',
    categoryId: 'blandat',
    calorieLevel: 2200,
    description: 'För lätt viktökning eller högre aktivitetsnivå',
    totals: { protein: 175, carbs: 210, fat: 72, kcal: 2200 },
    meals: [
      {
        id: 'b2200-frukost',
        name: 'Frukost',
        time: '07:00',
        totalProtein: 38, totalCarbs: 50, totalFat: 16, totalKcal: 495,
        foods: [
          { name: 'Havregryn', amountG: 80, protein: 9.6, carbs: 48, fat: 5.6, kcal: 296, category: 'kolhydrat' },
          { name: 'Kvarg naturell', amountG: 200, protein: 24, carbs: 7, fat: 0.5, kcal: 128, category: 'protein' },
          { name: 'Blåbär', amountG: 70, protein: 0.5, carbs: 7, fat: 0.3, kcal: 40, category: 'kolhydrat' },
          { name: 'Valnötter', amountG: 18, protein: 2.7, carbs: 1.2, fat: 12, kcal: 117, category: 'fett' }
        ]
      },
      {
        id: 'b2200-lunch',
        name: 'Lunch',
        time: '12:00',
        totalProtein: 48, totalCarbs: 60, totalFat: 20, totalKcal: 610,
        foods: [
          { name: 'Kycklinglårfilé', amountG: 200, protein: 40, carbs: 0, fat: 10, kcal: 250, category: 'protein' },
          { name: 'Couscous (kokt)', amountG: 200, protein: 5, carbs: 46, fat: 0.4, kcal: 226, category: 'kolhydrat' },
          { name: 'Kikärtor', amountG: 50, protein: 4.8, carbs: 13.5, fat: 1.5, kcal: 82, category: 'kolhydrat' },
          { name: 'Fetaost', amountG: 20, protein: 3, carbs: 0.8, fat: 4, kcal: 52, category: 'fett' },
          { name: 'Gurka & tomat', amountG: 80, protein: 0.8, carbs: 3, fat: 0.2, kcal: 14, category: 'grönsak' }
        ]
      },
      {
        id: 'b2200-mellanmal',
        name: 'Mellanmål',
        time: '15:00',
        totalProtein: 28, totalCarbs: 35, totalFat: 12, totalKcal: 355,
        foods: [
          { name: 'Grekisk yoghurt 10%', amountG: 175, protein: 15, carbs: 6, fat: 10, kcal: 177, category: 'protein' },
          { name: 'Müsli utan tillsatt socker', amountG: 40, protein: 4, carbs: 24, fat: 3, kcal: 148, category: 'kolhydrat' },
          { name: 'Honung', amountG: 10, protein: 0, carbs: 8, fat: 0, kcal: 30, category: 'kolhydrat' }
        ]
      },
      {
        id: 'b2200-middag',
        name: 'Middag',
        time: '18:00',
        totalProtein: 45, totalCarbs: 50, totalFat: 20, totalKcal: 565,
        foods: [
          { name: 'Torskfilé', amountG: 200, protein: 36, carbs: 0, fat: 1.5, kcal: 164, category: 'protein' },
          { name: 'Potatis (kokt)', amountG: 250, protein: 5, carbs: 43, fat: 0.2, kcal: 193, category: 'kolhydrat' },
          { name: 'Remouladsås', amountG: 30, protein: 0.5, carbs: 3, fat: 15, kcal: 150, category: 'fett' },
          { name: 'Ärtor', amountG: 80, protein: 4.3, carbs: 9.4, fat: 0.3, kcal: 58, category: 'grönsak' }
        ]
      },
      {
        id: 'b2200-kvallsmal',
        name: 'Kvällsmål',
        time: '21:00',
        totalProtein: 16, totalCarbs: 15, totalFat: 4, totalKcal: 175,
        foods: [
          { name: 'Keso naturell', amountG: 175, protein: 21, carbs: 5.3, fat: 7, kcal: 172, category: 'protein' }
        ]
      }
    ]
  },

  // BLANDAT KOST - 2500 kcal
  {
    id: 'blandat-2500',
    name: 'Blandat kost 2500 kcal',
    categoryId: 'blandat',
    calorieLevel: 2500,
    description: 'För muskelbygge eller hög aktivitetsnivå',
    totals: { protein: 200, carbs: 240, fat: 80, kcal: 2500 },
    meals: [
      {
        id: 'b2500-frukost',
        name: 'Frukost',
        time: '07:00',
        totalProtein: 42, totalCarbs: 55, totalFat: 18, totalKcal: 550,
        foods: [
          { name: 'Havregryn', amountG: 90, protein: 10.8, carbs: 54, fat: 6.3, kcal: 333, category: 'kolhydrat' },
          { name: 'Kvarg vanilj', amountG: 225, protein: 22.5, carbs: 9, fat: 0.5, kcal: 131, category: 'protein' },
          { name: 'Banan', amountG: 100, protein: 1, carbs: 20, fat: 0.3, kcal: 89, category: 'kolhydrat' },
          { name: 'Jordnötssmör', amountG: 20, protein: 5, carbs: 3.3, fat: 10, kcal: 120, category: 'fett' }
        ]
      },
      {
        id: 'b2500-lunch',
        name: 'Lunch',
        time: '12:00',
        totalProtein: 55, totalCarbs: 70, totalFat: 22, totalKcal: 695,
        foods: [
          { name: 'Kycklingfilé', amountG: 225, protein: 50, carbs: 0, fat: 5, kcal: 248, category: 'protein' },
          { name: 'Basmatiris (kokt)', amountG: 250, protein: 6.3, carbs: 70, fat: 0.8, kcal: 325, category: 'kolhydrat' },
          { name: 'Broccoli', amountG: 120, protein: 3.4, carbs: 4.8, fat: 0.5, kcal: 41, category: 'grönsak' },
          { name: 'Olivolja', amountG: 15, protein: 0, carbs: 0, fat: 15, kcal: 133, category: 'fett' }
        ]
      },
      {
        id: 'b2500-mellanmal',
        name: 'Mellanmål',
        time: '15:00',
        totalProtein: 32, totalCarbs: 40, totalFat: 14, totalKcal: 410,
        foods: [
          { name: 'Proteinshake', amountG: 40, protein: 30, carbs: 4, fat: 2, kcal: 154, category: 'protein' },
          { name: 'Banan', amountG: 130, protein: 1.4, carbs: 26, fat: 0.4, kcal: 116, category: 'kolhydrat' },
          { name: 'Mandlar', amountG: 25, protein: 5.3, carbs: 2.5, fat: 12.5, kcal: 145, category: 'fett' }
        ]
      },
      {
        id: 'b2500-middag',
        name: 'Middag',
        time: '18:00',
        totalProtein: 50, totalCarbs: 55, totalFat: 22, totalKcal: 620,
        foods: [
          { name: 'Laxfilé', amountG: 175, protein: 35, carbs: 0, fat: 22, kcal: 350, category: 'protein' },
          { name: 'Sötpotatis (kokt)', amountG: 250, protein: 4, carbs: 50, fat: 0.2, kcal: 225, category: 'kolhydrat' },
          { name: 'Sparris', amountG: 100, protein: 2.2, carbs: 3.9, fat: 0.1, kcal: 20, category: 'grönsak' },
          { name: 'Citron', amountG: 15, protein: 0, carbs: 1.4, fat: 0, kcal: 4, category: 'grönsak' }
        ]
      },
      {
        id: 'b2500-kvallsmal',
        name: 'Kvällsmål',
        time: '21:00',
        totalProtein: 21, totalCarbs: 20, totalFat: 4, totalKcal: 225,
        foods: [
          { name: 'Keso naturell', amountG: 200, protein: 24, carbs: 6, fat: 8, kcal: 196, category: 'protein' },
          { name: 'Hallon', amountG: 50, protein: 0.6, carbs: 2.5, fat: 0.3, kcal: 16, category: 'kolhydrat' }
        ]
      }
    ]
  },

  // STANDARD - 1800 kcal
  {
    id: 'standard-1800',
    name: 'Standard 1800 kcal',
    categoryId: 'standard',
    calorieLevel: 1800,
    description: 'Klassiskt schema med tre huvudmål och två mellanmål',
    totals: { protein: 140, carbs: 175, fat: 60, kcal: 1800 },
    meals: [
      {
        id: 's1800-frukost',
        name: 'Frukost',
        time: '07:30',
        totalProtein: 25, totalCarbs: 45, totalFat: 12, totalKcal: 390,
        foods: [
          { name: 'Ägg (kokt)', amountG: 100, protein: 13, carbs: 1, fat: 11, kcal: 155, category: 'protein' },
          { name: 'Fullkornsbröd', amountG: 60, protein: 5.4, carbs: 28, fat: 1.8, kcal: 152, category: 'kolhydrat' },
          { name: 'Smör', amountG: 10, protein: 0.1, carbs: 0, fat: 8.2, kcal: 74, category: 'fett' },
          { name: 'Tomat', amountG: 50, protein: 0.4, carbs: 2, fat: 0.1, kcal: 9, category: 'grönsak' }
        ]
      },
      {
        id: 's1800-lunch',
        name: 'Lunch',
        time: '12:00',
        totalProtein: 40, totalCarbs: 50, totalFat: 15, totalKcal: 495,
        foods: [
          { name: 'Grillad kyckling', amountG: 160, protein: 36, carbs: 0, fat: 4, kcal: 176, category: 'protein' },
          { name: 'Quinoa (kokt)', amountG: 150, protein: 6, carbs: 32, fat: 3, kcal: 180, category: 'kolhydrat' },
          { name: 'Blandad sallad', amountG: 100, protein: 1.5, carbs: 4, fat: 0.2, kcal: 20, category: 'grönsak' },
          { name: 'Olivolja & vinäger', amountG: 15, protein: 0, carbs: 0.5, fat: 13, kcal: 119, category: 'fett' }
        ]
      },
      {
        id: 's1800-mellanmal1',
        name: 'Mellanmål',
        time: '15:30',
        totalProtein: 18, totalCarbs: 25, totalFat: 8, totalKcal: 240,
        foods: [
          { name: 'Äpplen', amountG: 150, protein: 0.4, carbs: 21, fat: 0.3, kcal: 78, category: 'kolhydrat' },
          { name: 'Mandlar', amountG: 20, protein: 4.2, carbs: 2, fat: 10, kcal: 116, category: 'fett' },
          { name: 'Proteinstång', amountG: 30, protein: 10, carbs: 8, fat: 3, kcal: 99, category: 'protein' }
        ]
      },
      {
        id: 's1800-middag',
        name: 'Middag',
        time: '18:30',
        totalProtein: 42, totalCarbs: 45, totalFat: 20, totalKcal: 530,
        foods: [
          { name: 'Köttfärslimpa', amountG: 150, protein: 27, carbs: 5, fat: 15, kcal: 263, category: 'protein' },
          { name: 'Potatismos', amountG: 175, protein: 3, carbs: 30, fat: 4, kcal: 168, category: 'kolhydrat' },
          { name: 'Lingonsylt', amountG: 20, protein: 0.1, carbs: 10, fat: 0, kcal: 41, category: 'kolhydrat' },
          { name: 'Kokt grönkål', amountG: 80, protein: 2.8, carbs: 2, fat: 0.5, kcal: 27, category: 'grönsak' }
        ]
      },
      {
        id: 's1800-kvallsmal',
        name: 'Kvällsmål',
        time: '21:00',
        totalProtein: 15, totalCarbs: 10, totalFat: 5, totalKcal: 145,
        foods: [
          { name: 'Filmjölk 3%', amountG: 200, protein: 7, carbs: 9, fat: 6, kcal: 118, category: 'protein' },
          { name: 'Blåbär', amountG: 30, protein: 0.2, carbs: 3.5, fat: 0.1, kcal: 17, category: 'kolhydrat' }
        ]
      }
    ]
  },

  // STANDARD - 2000 kcal
  {
    id: 'standard-2000',
    name: 'Standard 2000 kcal',
    categoryId: 'standard',
    calorieLevel: 2000,
    description: 'Klassiskt underhållsschema',
    totals: { protein: 155, carbs: 195, fat: 67, kcal: 2000 },
    meals: [
      {
        id: 's2000-frukost',
        name: 'Frukost',
        time: '07:30',
        totalProtein: 28, totalCarbs: 50, totalFat: 14, totalKcal: 435,
        foods: [
          { name: 'Ägg (stekt)', amountG: 110, protein: 14, carbs: 1, fat: 12, kcal: 170, category: 'protein' },
          { name: 'Fullkornsbröd', amountG: 80, protein: 7.2, carbs: 37, fat: 2.4, kcal: 203, category: 'kolhydrat' },
          { name: 'Smör', amountG: 10, protein: 0.1, carbs: 0, fat: 8.2, kcal: 74, category: 'fett' },
          { name: 'Gurka', amountG: 50, protein: 0.3, carbs: 1.5, fat: 0.1, kcal: 8, category: 'grönsak' }
        ]
      },
      {
        id: 's2000-lunch',
        name: 'Lunch',
        time: '12:00',
        totalProtein: 45, totalCarbs: 55, totalFat: 18, totalKcal: 560,
        foods: [
          { name: 'Fläskfilé', amountG: 180, protein: 39, carbs: 0, fat: 5, kcal: 198, category: 'protein' },
          { name: 'Ris (kokt)', amountG: 200, protein: 5, carbs: 56, fat: 0.6, kcal: 260, category: 'kolhydrat' },
          { name: 'Gräddsås', amountG: 40, protein: 1, carbs: 2, fat: 10, kcal: 102, category: 'fett' },
          { name: 'Ärtor och morötter', amountG: 80, protein: 2.5, carbs: 7, fat: 0.3, kcal: 43, category: 'grönsak' }
        ]
      },
      {
        id: 's2000-mellanmal1',
        name: 'Mellanmål',
        time: '15:30',
        totalProtein: 20, totalCarbs: 28, totalFat: 9, totalKcal: 270,
        foods: [
          { name: 'Fruktkvarg', amountG: 200, protein: 14, carbs: 20, fat: 0.4, kcal: 140, category: 'protein' },
          { name: 'Knäckebröd', amountG: 25, protein: 2.3, carbs: 15, fat: 0.4, kcal: 83, category: 'kolhydrat' },
          { name: 'Ost 28%', amountG: 15, protein: 4, carbs: 0, fat: 4.2, kcal: 53, category: 'fett' }
        ]
      },
      {
        id: 's2000-middag',
        name: 'Middag',
        time: '18:30',
        totalProtein: 45, totalCarbs: 50, totalFat: 22, totalKcal: 580,
        foods: [
          { name: 'Pannbiff', amountG: 175, protein: 32, carbs: 5, fat: 18, kcal: 310, category: 'protein' },
          { name: 'Potatis (kokt)', amountG: 200, protein: 4, carbs: 35, fat: 0.2, kcal: 154, category: 'kolhydrat' },
          { name: 'Stekt lök', amountG: 50, protein: 0.7, carbs: 5, fat: 3, kcal: 56, category: 'grönsak' },
          { name: 'Rårörda lingon', amountG: 30, protein: 0.2, carbs: 9, fat: 0.1, kcal: 38, category: 'kolhydrat' }
        ]
      },
      {
        id: 's2000-kvallsmal',
        name: 'Kvällsmål',
        time: '21:00',
        totalProtein: 17, totalCarbs: 12, totalFat: 4, totalKcal: 155,
        foods: [
          { name: 'Keso naturell', amountG: 150, protein: 18, carbs: 4.5, fat: 6, kcal: 147, category: 'protein' }
        ]
      }
    ]
  },

  // VEGETARISKT - 1800 kcal
  {
    id: 'vegetariskt-1800',
    name: 'Vegetariskt 1800 kcal',
    categoryId: 'vegetariskt',
    calorieLevel: 1800,
    description: 'Vegetariskt schema utan kött och fisk',
    totals: { protein: 110, carbs: 195, fat: 65, kcal: 1800 },
    meals: [
      {
        id: 'v1800-frukost',
        name: 'Frukost',
        time: '07:30',
        totalProtein: 22, totalCarbs: 45, totalFat: 14, totalKcal: 390,
        foods: [
          { name: 'Havregrynsgröt', amountG: 300, protein: 9, carbs: 39, fat: 5, kcal: 237, category: 'kolhydrat' },
          { name: 'Mjölk 3%', amountG: 100, protein: 3.4, carbs: 4.7, fat: 3, kcal: 60, category: 'protein' },
          { name: 'Äpple', amountG: 100, protein: 0.3, carbs: 14, fat: 0.2, kcal: 52, category: 'kolhydrat' },
          { name: 'Linfrön', amountG: 15, protein: 2.7, carbs: 0.4, fat: 6.3, kcal: 80, category: 'fett' }
        ]
      },
      {
        id: 'v1800-lunch',
        name: 'Lunch',
        time: '12:00',
        totalProtein: 28, totalCarbs: 55, totalFat: 18, totalKcal: 490,
        foods: [
          { name: 'Halloumi', amountG: 80, protein: 18, carbs: 0.8, fat: 20, kcal: 254, category: 'protein' },
          { name: 'Couscous (kokt)', amountG: 150, protein: 4, carbs: 35, fat: 0.3, kcal: 169, category: 'kolhydrat' },
          { name: 'Paprika & tomat', amountG: 100, protein: 1, carbs: 5, fat: 0.2, kcal: 25, category: 'grönsak' },
          { name: 'Hummus', amountG: 40, protein: 3, carbs: 6, fat: 6, kcal: 92, category: 'fett' }
        ]
      },
      {
        id: 'v1800-mellanmal',
        name: 'Mellanmål',
        time: '15:30',
        totalProtein: 15, totalCarbs: 30, totalFat: 10, totalKcal: 270,
        foods: [
          { name: 'Grekisk yoghurt 10%', amountG: 150, protein: 13, carbs: 5, fat: 9, kcal: 156, category: 'protein' },
          { name: 'Müsli', amountG: 35, protein: 3.5, carbs: 21, fat: 2.5, kcal: 130, category: 'kolhydrat' }
        ]
      },
      {
        id: 'v1800-middag',
        name: 'Middag',
        time: '18:30',
        totalProtein: 30, totalCarbs: 50, totalFat: 18, totalKcal: 480,
        foods: [
          { name: 'Bönbiffar', amountG: 150, protein: 18, carbs: 20, fat: 5, kcal: 197, category: 'protein' },
          { name: 'Quinoa (kokt)', amountG: 150, protein: 6, carbs: 32, fat: 3, kcal: 180, category: 'kolhydrat' },
          { name: 'Avokado', amountG: 50, protein: 1, carbs: 4, fat: 7.5, kcal: 80, category: 'fett' },
          { name: 'Sallad mix', amountG: 80, protein: 1, carbs: 2, fat: 0.1, kcal: 14, category: 'grönsak' }
        ]
      },
      {
        id: 'v1800-kvallsmal',
        name: 'Kvällsmål',
        time: '21:00',
        totalProtein: 15, totalCarbs: 15, totalFat: 5, totalKcal: 170,
        foods: [
          { name: 'Sojayoghurt', amountG: 200, protein: 8, carbs: 10, fat: 4, kcal: 108, category: 'protein' },
          { name: 'Bär', amountG: 50, protein: 0.5, carbs: 5, fat: 0.2, kcal: 24, category: 'kolhydrat' }
        ]
      }
    ]
  },

  // VEGETARISKT - 2000 kcal
  {
    id: 'vegetariskt-2000',
    name: 'Vegetariskt 2000 kcal',
    categoryId: 'vegetariskt',
    calorieLevel: 2000,
    description: 'Vegetariskt underhållsschema',
    totals: { protein: 120, carbs: 220, fat: 72, kcal: 2000 },
    meals: [
      {
        id: 'v2000-frukost',
        name: 'Frukost',
        time: '07:30',
        totalProtein: 25, totalCarbs: 52, totalFat: 16, totalKcal: 450,
        foods: [
          { name: 'Overnight oats', amountG: 80, protein: 10, carbs: 48, fat: 6, kcal: 296, category: 'kolhydrat' },
          { name: 'Kvarg naturell', amountG: 150, protein: 18, carbs: 5, fat: 0.3, kcal: 96, category: 'protein' },
          { name: 'Chiafröer', amountG: 15, protein: 2.5, carbs: 6, fat: 4.6, kcal: 73, category: 'fett' },
          { name: 'Blåbär', amountG: 60, protein: 0.4, carbs: 7, fat: 0.2, kcal: 34, category: 'kolhydrat' }
        ]
      },
      {
        id: 'v2000-lunch',
        name: 'Lunch',
        time: '12:00',
        totalProtein: 32, totalCarbs: 60, totalFat: 20, totalKcal: 550,
        foods: [
          { name: 'Tofu (stekt)', amountG: 150, protein: 18, carbs: 3, fat: 10.5, kcal: 181, category: 'protein' },
          { name: 'Jasminris (kokt)', amountG: 200, protein: 5, carbs: 56, fat: 0.5, kcal: 260, category: 'kolhydrat' },
          { name: 'Wokgrönsaker', amountG: 120, protein: 2.5, carbs: 6, fat: 0.3, kcal: 36, category: 'grönsak' },
          { name: 'Sesamolja', amountG: 10, protein: 0, carbs: 0, fat: 10, kcal: 88, category: 'fett' }
        ]
      },
      {
        id: 'v2000-mellanmal',
        name: 'Mellanmål',
        time: '15:30',
        totalProtein: 18, totalCarbs: 35, totalFat: 12, totalKcal: 315,
        foods: [
          { name: 'Proteinpudding (växtbaserad)', amountG: 200, protein: 15, carbs: 12, fat: 3, kcal: 139, category: 'protein' },
          { name: 'Banan', amountG: 120, protein: 1.3, carbs: 24, fat: 0.4, kcal: 107, category: 'kolhydrat' },
          { name: 'Jordnötssmör', amountG: 15, protein: 3.8, carbs: 2.5, fat: 7.5, kcal: 90, category: 'fett' }
        ]
      },
      {
        id: 'v2000-middag',
        name: 'Middag',
        time: '18:30',
        totalProtein: 30, totalCarbs: 55, totalFat: 20, totalKcal: 520,
        foods: [
          { name: 'Kikärtscurry', amountG: 250, protein: 15, carbs: 35, fat: 10, kcal: 290, category: 'protein' },
          { name: 'Naanbröd', amountG: 60, protein: 5, carbs: 32, fat: 4, kcal: 184, category: 'kolhydrat' },
          { name: 'Raita (yoghurtsås)', amountG: 50, protein: 2, carbs: 3, fat: 2, kcal: 38, category: 'fett' }
        ]
      },
      {
        id: 'v2000-kvallsmal',
        name: 'Kvällsmål',
        time: '21:00',
        totalProtein: 15, totalCarbs: 18, totalFat: 4, totalKcal: 165,
        foods: [
          { name: 'Keso naturell', amountG: 150, protein: 18, carbs: 4.5, fat: 6, kcal: 147, category: 'protein' },
          { name: 'Hallon', amountG: 40, protein: 0.5, carbs: 2, fat: 0.2, kcal: 13, category: 'kolhydrat' }
        ]
      }
    ]
  },

  // LÅGKOLHYDRAT - 1800 kcal
  {
    id: 'lowcarb-1800',
    name: 'Lågkolhydrat 1800 kcal',
    categoryId: 'low-carb',
    calorieLevel: 1800,
    description: 'Lågkolhydrat för viktnedgång',
    totals: { protein: 150, carbs: 80, fat: 105, kcal: 1800 },
    meals: [
      {
        id: 'lc1800-frukost',
        name: 'Frukost',
        time: '07:30',
        totalProtein: 30, totalCarbs: 8, totalFat: 28, totalKcal: 410,
        foods: [
          { name: 'Ägg (stekt)', amountG: 150, protein: 19.5, carbs: 1.5, fat: 17, kcal: 233, category: 'protein' },
          { name: 'Bacon', amountG: 40, protein: 5, carbs: 0.5, fat: 16, kcal: 164, category: 'fett' },
          { name: 'Tomat', amountG: 80, protein: 0.7, carbs: 3.2, fat: 0.2, kcal: 14, category: 'grönsak' },
          { name: 'Avokado', amountG: 30, protein: 0.6, carbs: 2.5, fat: 4.5, kcal: 48, category: 'fett' }
        ]
      },
      {
        id: 'lc1800-lunch',
        name: 'Lunch',
        time: '12:00',
        totalProtein: 45, totalCarbs: 15, totalFat: 32, totalKcal: 535,
        foods: [
          { name: 'Laxfilé', amountG: 175, protein: 35, carbs: 0, fat: 22, kcal: 350, category: 'protein' },
          { name: 'Grönkål (stekt)', amountG: 100, protein: 3.3, carbs: 4, fat: 1, kcal: 35, category: 'grönsak' },
          { name: 'Smetana', amountG: 40, protein: 1, carbs: 1.5, fat: 12, kcal: 116, category: 'fett' },
          { name: 'Broccoli', amountG: 100, protein: 2.8, carbs: 4, fat: 0.4, kcal: 34, category: 'grönsak' }
        ]
      },
      {
        id: 'lc1800-mellanmal',
        name: 'Mellanmål',
        time: '15:30',
        totalProtein: 20, totalCarbs: 12, totalFat: 18, totalKcal: 290,
        foods: [
          { name: 'Ost 28%', amountG: 40, protein: 10, carbs: 0.5, fat: 11, kcal: 140, category: 'protein' },
          { name: 'Nötmix', amountG: 25, protein: 5, carbs: 4, fat: 14, kcal: 163, category: 'fett' },
          { name: 'Selleri', amountG: 50, protein: 0.3, carbs: 1.5, fat: 0.1, kcal: 8, category: 'grönsak' }
        ]
      },
      {
        id: 'lc1800-middag',
        name: 'Middag',
        time: '18:30',
        totalProtein: 42, totalCarbs: 12, totalFat: 25, totalKcal: 445,
        foods: [
          { name: 'Kycklinglårfilé', amountG: 180, protein: 36, carbs: 0, fat: 9, kcal: 225, category: 'protein' },
          { name: 'Blomkålsris', amountG: 150, protein: 3, carbs: 6, fat: 0.5, kcal: 38, category: 'grönsak' },
          { name: 'Färskost', amountG: 40, protein: 2.4, carbs: 1.5, fat: 12, kcal: 120, category: 'fett' },
          { name: 'Spenat', amountG: 80, protein: 2.3, carbs: 2.9, fat: 0.3, kcal: 19, category: 'grönsak' }
        ]
      },
      {
        id: 'lc1800-kvallsmal',
        name: 'Kvällsmål',
        time: '21:00',
        totalProtein: 13, totalCarbs: 3, totalFat: 2, totalKcal: 120,
        foods: [
          { name: 'Keso naturell', amountG: 150, protein: 18, carbs: 4.5, fat: 6, kcal: 147, category: 'protein' }
        ]
      }
    ]
  },

  // HÖGPROTEIN - 2200 kcal
  {
    id: 'highprotein-2200',
    name: 'Högprotein 2200 kcal',
    categoryId: 'high-protein',
    calorieLevel: 2200,
    description: 'Extra protein för muskelbygge och återhämtning',
    totals: { protein: 200, carbs: 180, fat: 70, kcal: 2200 },
    meals: [
      {
        id: 'hp2200-frukost',
        name: 'Frukost',
        time: '07:00',
        totalProtein: 45, totalCarbs: 40, totalFat: 14, totalKcal: 465,
        foods: [
          { name: 'Äggvita', amountG: 150, protein: 16.5, carbs: 1, fat: 0.3, kcal: 78, category: 'protein' },
          { name: 'Ägg (helt)', amountG: 50, protein: 6.5, carbs: 0.5, fat: 5.5, kcal: 78, category: 'protein' },
          { name: 'Havregryn', amountG: 60, protein: 7, carbs: 36, fat: 4, kcal: 222, category: 'kolhydrat' },
          { name: 'Proteinpulver', amountG: 20, protein: 16, carbs: 2, fat: 1, kcal: 81, category: 'protein' },
          { name: 'Blåbär', amountG: 50, protein: 0.4, carbs: 6, fat: 0.2, kcal: 29, category: 'kolhydrat' }
        ]
      },
      {
        id: 'hp2200-lunch',
        name: 'Lunch',
        time: '12:00',
        totalProtein: 55, totalCarbs: 50, totalFat: 18, totalKcal: 580,
        foods: [
          { name: 'Kycklingbröst', amountG: 225, protein: 50, carbs: 0, fat: 5, kcal: 248, category: 'protein' },
          { name: 'Basmatiris (kokt)', amountG: 175, protein: 4.4, carbs: 49, fat: 0.5, kcal: 227, category: 'kolhydrat' },
          { name: 'Broccoli', amountG: 120, protein: 3.4, carbs: 4.8, fat: 0.5, kcal: 41, category: 'grönsak' },
          { name: 'Olivolja', amountG: 10, protein: 0, carbs: 0, fat: 10, kcal: 88, category: 'fett' }
        ]
      },
      {
        id: 'hp2200-mellanmal',
        name: 'Mellanmål',
        time: '15:00',
        totalProtein: 35, totalCarbs: 30, totalFat: 12, totalKcal: 365,
        foods: [
          { name: 'Proteinshake', amountG: 40, protein: 30, carbs: 4, fat: 2, kcal: 154, category: 'protein' },
          { name: 'Banan', amountG: 130, protein: 1.4, carbs: 26, fat: 0.4, kcal: 116, category: 'kolhydrat' },
          { name: 'Jordnötssmör', amountG: 18, protein: 4.5, carbs: 3, fat: 9, kcal: 108, category: 'fett' }
        ]
      },
      {
        id: 'hp2200-middag',
        name: 'Middag',
        time: '18:30',
        totalProtein: 50, totalCarbs: 45, totalFat: 22, totalKcal: 580,
        foods: [
          { name: 'Nötfärs 10%', amountG: 175, protein: 35, carbs: 0, fat: 17.5, kcal: 298, category: 'protein' },
          { name: 'Pasta (kokt)', amountG: 175, protein: 6, carbs: 43, fat: 1, kcal: 219, category: 'kolhydrat' },
          { name: 'Tomatsås', amountG: 80, protein: 1.2, carbs: 6.4, fat: 0.2, kcal: 32, category: 'grönsak' },
          { name: 'Parmesan', amountG: 10, protein: 4, carbs: 0, fat: 3, kcal: 43, category: 'fett' }
        ]
      },
      {
        id: 'hp2200-kvallsmal',
        name: 'Kvällsmål',
        time: '21:00',
        totalProtein: 15, totalCarbs: 15, totalFat: 4, totalKcal: 210,
        foods: [
          { name: 'Keso naturell', amountG: 200, protein: 24, carbs: 6, fat: 8, kcal: 196, category: 'protein' },
          { name: 'Hallon', amountG: 40, protein: 0.5, carbs: 2, fat: 0.2, kcal: 13, category: 'kolhydrat' }
        ]
      }
    ]
  },

  // HÖGPROTEIN - 2500 kcal
  {
    id: 'highprotein-2500',
    name: 'Högprotein 2500 kcal',
    categoryId: 'high-protein',
    calorieLevel: 2500,
    description: 'Maximalt protein för seriös muskelbygge',
    totals: { protein: 225, carbs: 210, fat: 78, kcal: 2500 },
    meals: [
      {
        id: 'hp2500-frukost',
        name: 'Frukost',
        time: '07:00',
        totalProtein: 50, totalCarbs: 50, totalFat: 16, totalKcal: 545,
        foods: [
          { name: 'Äggvita', amountG: 180, protein: 20, carbs: 1.2, fat: 0.4, kcal: 94, category: 'protein' },
          { name: 'Ägg (helt)', amountG: 100, protein: 13, carbs: 1, fat: 11, kcal: 155, category: 'protein' },
          { name: 'Havregryn', amountG: 70, protein: 8.4, carbs: 42, fat: 4.9, kcal: 259, category: 'kolhydrat' },
          { name: 'Banan', amountG: 100, protein: 1, carbs: 20, fat: 0.3, kcal: 89, category: 'kolhydrat' }
        ]
      },
      {
        id: 'hp2500-lunch',
        name: 'Lunch',
        time: '12:00',
        totalProtein: 60, totalCarbs: 55, totalFat: 20, totalKcal: 645,
        foods: [
          { name: 'Kycklingbröst', amountG: 250, protein: 55, carbs: 0, fat: 6, kcal: 275, category: 'protein' },
          { name: 'Jasminris (kokt)', amountG: 200, protein: 5, carbs: 56, fat: 0.5, kcal: 260, category: 'kolhydrat' },
          { name: 'Broccoli', amountG: 150, protein: 4.2, carbs: 6, fat: 0.6, kcal: 51, category: 'grönsak' },
          { name: 'Olivolja', amountG: 12, protein: 0, carbs: 0, fat: 12, kcal: 106, category: 'fett' }
        ]
      },
      {
        id: 'hp2500-mellanmal1',
        name: 'Mellanmål 1',
        time: '15:00',
        totalProtein: 40, totalCarbs: 35, totalFat: 14, totalKcal: 425,
        foods: [
          { name: 'Proteinshake', amountG: 50, protein: 37.5, carbs: 5, fat: 2.5, kcal: 193, category: 'protein' },
          { name: 'Banan', amountG: 140, protein: 1.5, carbs: 28, fat: 0.4, kcal: 125, category: 'kolhydrat' },
          { name: 'Mandlar', amountG: 20, protein: 4.2, carbs: 2, fat: 10, kcal: 116, category: 'fett' }
        ]
      },
      {
        id: 'hp2500-middag',
        name: 'Middag',
        time: '18:30',
        totalProtein: 55, totalCarbs: 50, totalFat: 24, totalKcal: 640,
        foods: [
          { name: 'Entrecote', amountG: 200, protein: 42, carbs: 0, fat: 20, kcal: 350, category: 'protein' },
          { name: 'Potatis (kokt)', amountG: 250, protein: 5, carbs: 43, fat: 0.2, kcal: 193, category: 'kolhydrat' },
          { name: 'Bearnaisesås', amountG: 30, protein: 1, carbs: 1, fat: 10, kcal: 97, category: 'fett' },
          { name: 'Sparris', amountG: 100, protein: 2.2, carbs: 3.9, fat: 0.1, kcal: 20, category: 'grönsak' }
        ]
      },
      {
        id: 'hp2500-kvallsmal',
        name: 'Kvällsmål',
        time: '21:00',
        totalProtein: 20, totalCarbs: 20, totalFat: 4, totalKcal: 245,
        foods: [
          { name: 'Keso naturell', amountG: 225, protein: 27, carbs: 6.8, fat: 9, kcal: 220, category: 'protein' },
          { name: 'Blåbär', amountG: 50, protein: 0.4, carbs: 6, fat: 0.2, kcal: 29, category: 'kolhydrat' }
        ]
      }
    ]
  }
]

// Helper function to get schemas by category
export function getSchemasByCategory(categoryId: string): CatalogSchema[] {
  return CATALOG_SCHEMAS.filter(schema => schema.categoryId === categoryId)
}

// Helper function to get schema by id
export function getSchemaById(schemaId: string): CatalogSchema | undefined {
  return CATALOG_SCHEMAS.find(schema => schema.id === schemaId)
}

// Helper function to get all calorie levels for a category
export function getCalorieLevelsForCategory(categoryId: string): number[] {
  const schemas = getSchemasByCategory(categoryId)
  return [...new Set(schemas.map(s => s.calorieLevel))].sort((a, b) => a - b)
}
