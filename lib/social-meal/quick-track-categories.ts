import type { QuickTrackCategoryDef, QuickTrackCategory, QuickTrackFoodItem } from './types';

// Quick Track Categories with common Swedish foods
// Nutritional values are approximate and based on Swedish food databases

export const QUICK_TRACK_CATEGORIES: Record<QuickTrackCategory, QuickTrackCategoryDef> = {
  protein: {
    icon: '🥩',
    label: 'Protein',
    color: 'rose',
    commonItems: [
      // KYCKLING & FÅGEL
      {
        id: 'kycklingfile',
        name: 'Kycklingfilé',
        portions: [
          { size: 'small', grams: 100, kcal: 110, protein: 23, carbs: 0, fat: 1.5 },
          { size: 'normal', grams: 150, kcal: 165, protein: 34.5, carbs: 0, fat: 2.3 },
          { size: 'large', grams: 200, kcal: 220, protein: 46, carbs: 0, fat: 3 },
          { size: 'extra', grams: 250, kcal: 275, protein: 57.5, carbs: 0, fat: 3.8 },
        ],
        per100g: { kcal: 110, protein: 23, carbs: 0, fat: 1.5 },
      },
      {
        id: 'kycklingklubba',
        name: 'Kycklingklubba',
        portions: [
          { size: 'small', grams: 80, kcal: 136, protein: 16, carbs: 0, fat: 8 },
          { size: 'normal', grams: 120, kcal: 204, protein: 24, carbs: 0, fat: 12 },
          { size: 'large', grams: 160, kcal: 272, protein: 32, carbs: 0, fat: 16 },
        ],
        per100g: { kcal: 170, protein: 20, carbs: 0, fat: 10 },
      },
      {
        id: 'kalkon',
        name: 'Kalkonfilé',
        portions: [
          { size: 'small', grams: 100, kcal: 104, protein: 24, carbs: 0, fat: 0.7 },
          { size: 'normal', grams: 150, kcal: 156, protein: 36, carbs: 0, fat: 1 },
          { size: 'large', grams: 200, kcal: 208, protein: 48, carbs: 0, fat: 1.4 },
        ],
        per100g: { kcal: 104, protein: 24, carbs: 0, fat: 0.7 },
      },
      // NÖT
      {
        id: 'kottbullar',
        name: 'Köttbullar',
        portions: [
          { size: 'small', grams: 80, kcal: 176, protein: 14, carbs: 5, fat: 11 },
          { size: 'normal', grams: 120, kcal: 264, protein: 21, carbs: 7.5, fat: 16.5 },
          { size: 'large', grams: 180, kcal: 396, protein: 31.5, carbs: 11, fat: 25 },
          { size: 'extra', grams: 240, kcal: 528, protein: 42, carbs: 15, fat: 33 },
        ],
        per100g: { kcal: 220, protein: 17.5, carbs: 6, fat: 14 },
      },
      {
        id: 'pannbiff',
        name: 'Pannbiff',
        portions: [
          { size: 'small', grams: 100, kcal: 200, protein: 17, carbs: 5, fat: 13 },
          { size: 'normal', grams: 150, kcal: 300, protein: 25.5, carbs: 7.5, fat: 19.5 },
          { size: 'large', grams: 200, kcal: 400, protein: 34, carbs: 10, fat: 26 },
        ],
        per100g: { kcal: 200, protein: 17, carbs: 5, fat: 13 },
      },
      {
        id: 'kotfarssas',
        name: 'Köttfärssås',
        portions: [
          { size: 'small', grams: 150, kcal: 180, protein: 12, carbs: 9, fat: 11 },
          { size: 'normal', grams: 200, kcal: 240, protein: 16, carbs: 12, fat: 14.5 },
          { size: 'large', grams: 300, kcal: 360, protein: 24, carbs: 18, fat: 22 },
        ],
        per100g: { kcal: 120, protein: 8, carbs: 6, fat: 7.5 },
      },
      {
        id: 'biff',
        name: 'Biff/Entrecôte',
        portions: [
          { size: 'small', grams: 100, kcal: 200, protein: 26, carbs: 0, fat: 10 },
          { size: 'normal', grams: 150, kcal: 300, protein: 39, carbs: 0, fat: 15 },
          { size: 'large', grams: 200, kcal: 400, protein: 52, carbs: 0, fat: 20 },
          { size: 'extra', grams: 300, kcal: 600, protein: 78, carbs: 0, fat: 30 },
        ],
        per100g: { kcal: 200, protein: 26, carbs: 0, fat: 10 },
      },
      {
        id: 'kalops',
        name: 'Kalops (gryta)',
        portions: [
          { size: 'small', grams: 200, kcal: 200, protein: 18, carbs: 10, fat: 10 },
          { size: 'normal', grams: 300, kcal: 300, protein: 27, carbs: 15, fat: 15 },
          { size: 'large', grams: 400, kcal: 400, protein: 36, carbs: 20, fat: 20 },
        ],
        per100g: { kcal: 100, protein: 9, carbs: 5, fat: 5 },
      },
      {
        id: 'kotfars',
        name: 'Stekt köttfärs',
        portions: [
          { size: 'small', grams: 80, kcal: 184, protein: 15, carbs: 0, fat: 14 },
          { size: 'normal', grams: 120, kcal: 276, protein: 22.5, carbs: 0, fat: 21 },
          { size: 'large', grams: 180, kcal: 414, protein: 34, carbs: 0, fat: 31.5 },
        ],
        per100g: { kcal: 230, protein: 18.5, carbs: 0, fat: 17.5 },
      },
      // FLÄSK
      {
        id: 'falukorv',
        name: 'Falukorv',
        portions: [
          { size: 'small', grams: 80, kcal: 192, protein: 9, carbs: 4, fat: 16 },
          { size: 'normal', grams: 120, kcal: 288, protein: 13.5, carbs: 6, fat: 24 },
          { size: 'large', grams: 180, kcal: 432, protein: 20, carbs: 9, fat: 36 },
        ],
        per100g: { kcal: 240, protein: 11, carbs: 5, fat: 20 },
      },
      {
        id: 'korv_stroganoff',
        name: 'Korv Stroganoff',
        portions: [
          { size: 'small', grams: 200, kcal: 300, protein: 10, carbs: 12, fat: 24 },
          { size: 'normal', grams: 300, kcal: 450, protein: 15, carbs: 18, fat: 36 },
          { size: 'large', grams: 400, kcal: 600, protein: 20, carbs: 24, fat: 48 },
        ],
        per100g: { kcal: 150, protein: 5, carbs: 6, fat: 12 },
      },
      {
        id: 'flaskfile',
        name: 'Fläskfilé',
        portions: [
          { size: 'small', grams: 100, kcal: 130, protein: 25, carbs: 0, fat: 3 },
          { size: 'normal', grams: 150, kcal: 195, protein: 37.5, carbs: 0, fat: 4.5 },
          { size: 'large', grams: 200, kcal: 260, protein: 50, carbs: 0, fat: 6 },
        ],
        per100g: { kcal: 130, protein: 25, carbs: 0, fat: 3 },
      },
      {
        id: 'kassler',
        name: 'Kassler',
        portions: [
          { size: 'small', grams: 80, kcal: 128, protein: 16, carbs: 1, fat: 7 },
          { size: 'normal', grams: 120, kcal: 192, protein: 24, carbs: 1.5, fat: 10.5 },
          { size: 'large', grams: 180, kcal: 288, protein: 36, carbs: 2, fat: 15.5 },
        ],
        per100g: { kcal: 160, protein: 20, carbs: 1, fat: 8.5 },
      },
      {
        id: 'bacon',
        name: 'Bacon (stekt)',
        portions: [
          { size: 'small', grams: 30, kcal: 129, protein: 8, carbs: 0, fat: 11 },
          { size: 'normal', grams: 50, kcal: 215, protein: 13, carbs: 0, fat: 18 },
          { size: 'large', grams: 80, kcal: 344, protein: 21, carbs: 0, fat: 29 },
        ],
        per100g: { kcal: 430, protein: 26, carbs: 0, fat: 36 },
      },
      {
        id: 'flaskkarré',
        name: 'Fläskkotlett',
        portions: [
          { size: 'small', grams: 100, kcal: 180, protein: 22, carbs: 0, fat: 10 },
          { size: 'normal', grams: 150, kcal: 270, protein: 33, carbs: 0, fat: 15 },
          { size: 'large', grams: 200, kcal: 360, protein: 44, carbs: 0, fat: 20 },
        ],
        per100g: { kcal: 180, protein: 22, carbs: 0, fat: 10 },
      },
      // FISK
      {
        id: 'lax',
        name: 'Lax (ugns/stekt)',
        portions: [
          { size: 'small', grams: 100, kcal: 180, protein: 20, carbs: 0, fat: 11 },
          { size: 'normal', grams: 150, kcal: 270, protein: 30, carbs: 0, fat: 16.5 },
          { size: 'large', grams: 200, kcal: 360, protein: 40, carbs: 0, fat: 22 },
        ],
        per100g: { kcal: 180, protein: 20, carbs: 0, fat: 11 },
      },
      {
        id: 'torsk',
        name: 'Torsk',
        portions: [
          { size: 'small', grams: 100, kcal: 82, protein: 18, carbs: 0, fat: 0.7 },
          { size: 'normal', grams: 150, kcal: 123, protein: 27, carbs: 0, fat: 1 },
          { size: 'large', grams: 200, kcal: 164, protein: 36, carbs: 0, fat: 1.4 },
        ],
        per100g: { kcal: 82, protein: 18, carbs: 0, fat: 0.7 },
      },
      {
        id: 'sill',
        name: 'Inlagd sill',
        portions: [
          { size: 'small', grams: 50, kcal: 90, protein: 7, carbs: 4, fat: 5 },
          { size: 'normal', grams: 80, kcal: 144, protein: 11, carbs: 6.5, fat: 8 },
          { size: 'large', grams: 120, kcal: 216, protein: 17, carbs: 10, fat: 12 },
        ],
        per100g: { kcal: 180, protein: 14, carbs: 8, fat: 10 },
      },
      {
        id: 'fiskpinnar',
        name: 'Fiskpinnar',
        portions: [
          { size: 'small', grams: 90, kcal: 180, protein: 10, carbs: 15, fat: 9 },
          { size: 'normal', grams: 135, kcal: 270, protein: 15, carbs: 22.5, fat: 13.5 },
          { size: 'large', grams: 180, kcal: 360, protein: 20, carbs: 30, fat: 18 },
        ],
        per100g: { kcal: 200, protein: 11, carbs: 17, fat: 10 },
      },
      {
        id: 'fiskgratang',
        name: 'Fiskgratäng',
        portions: [
          { size: 'small', grams: 200, kcal: 260, protein: 16, carbs: 16, fat: 14 },
          { size: 'normal', grams: 300, kcal: 390, protein: 24, carbs: 24, fat: 21 },
          { size: 'large', grams: 400, kcal: 520, protein: 32, carbs: 32, fat: 28 },
        ],
        per100g: { kcal: 130, protein: 8, carbs: 8, fat: 7 },
      },
      {
        id: 'rakor',
        name: 'Räkor (skalade)',
        portions: [
          { size: 'small', grams: 50, kcal: 45, protein: 10, carbs: 0, fat: 0.5 },
          { size: 'normal', grams: 100, kcal: 90, protein: 20, carbs: 0, fat: 1 },
          { size: 'large', grams: 150, kcal: 135, protein: 30, carbs: 0, fat: 1.5 },
        ],
        per100g: { kcal: 90, protein: 20, carbs: 0, fat: 1 },
      },
      // VEGETARISKT PROTEIN
      {
        id: 'quorn',
        name: 'Quorn färs/bitar',
        portions: [
          { size: 'small', grams: 80, kcal: 80, protein: 12, carbs: 3, fat: 2 },
          { size: 'normal', grams: 120, kcal: 120, protein: 18, carbs: 4.5, fat: 3 },
          { size: 'large', grams: 180, kcal: 180, protein: 27, carbs: 7, fat: 4.5 },
        ],
        per100g: { kcal: 100, protein: 15, carbs: 4, fat: 2.5 },
      },
      {
        id: 'tofu',
        name: 'Tofu',
        portions: [
          { size: 'small', grams: 80, kcal: 72, protein: 8, carbs: 1, fat: 4 },
          { size: 'normal', grams: 125, kcal: 112, protein: 12.5, carbs: 1.5, fat: 6.3 },
          { size: 'large', grams: 175, kcal: 157, protein: 17.5, carbs: 2, fat: 8.8 },
        ],
        per100g: { kcal: 90, protein: 10, carbs: 1.2, fat: 5 },
      },
      {
        id: 'linser',
        name: 'Linser (kokta)',
        portions: [
          { size: 'small', grams: 100, kcal: 116, protein: 9, carbs: 17, fat: 0.5 },
          { size: 'normal', grams: 150, kcal: 174, protein: 13.5, carbs: 25.5, fat: 0.8 },
          { size: 'large', grams: 200, kcal: 232, protein: 18, carbs: 34, fat: 1 },
        ],
        per100g: { kcal: 116, protein: 9, carbs: 17, fat: 0.5 },
      },
      {
        id: 'bonor',
        name: 'Bönor (kokta)',
        portions: [
          { size: 'small', grams: 100, kcal: 127, protein: 8, carbs: 20, fat: 0.5 },
          { size: 'normal', grams: 150, kcal: 190, protein: 12, carbs: 30, fat: 0.8 },
          { size: 'large', grams: 200, kcal: 254, protein: 16, carbs: 40, fat: 1 },
        ],
        per100g: { kcal: 127, protein: 8, carbs: 20, fat: 0.5 },
      },
      // ÄGG
      {
        id: 'agg_stekt',
        name: 'Stekt ägg',
        portions: [
          { size: 'small', grams: 50, kcal: 90, protein: 6, carbs: 0.5, fat: 7 },
          { size: 'normal', grams: 100, kcal: 180, protein: 12, carbs: 1, fat: 14 },
          { size: 'large', grams: 150, kcal: 270, protein: 18, carbs: 1.5, fat: 21 },
        ],
        per100g: { kcal: 180, protein: 12, carbs: 1, fat: 14 },
      },
      {
        id: 'agg_kokt',
        name: 'Kokt ägg',
        portions: [
          { size: 'small', grams: 50, kcal: 73, protein: 6, carbs: 0.5, fat: 5 },
          { size: 'normal', grams: 100, kcal: 146, protein: 12, carbs: 1, fat: 10 },
          { size: 'large', grams: 150, kcal: 219, protein: 18, carbs: 1.5, fat: 15 },
        ],
        per100g: { kcal: 146, protein: 12, carbs: 1, fat: 10 },
      },
      {
        id: 'aggrora',
        name: 'Äggröra',
        portions: [
          { size: 'small', grams: 80, kcal: 120, protein: 8, carbs: 1, fat: 10 },
          { size: 'normal', grams: 120, kcal: 180, protein: 12, carbs: 1.5, fat: 15 },
          { size: 'large', grams: 180, kcal: 270, protein: 18, carbs: 2, fat: 22.5 },
        ],
        per100g: { kcal: 150, protein: 10, carbs: 1.2, fat: 12.5 },
      },
    ],
  },

  carb: {
    icon: '🍚',
    label: 'Kolhydrat',
    color: 'amber',
    commonItems: [
      // POTATIS
      {
        id: 'potatis_kokt',
        name: 'Kokt potatis',
        portions: [
          { size: 'small', grams: 100, kcal: 77, protein: 2, carbs: 17, fat: 0.1 },
          { size: 'normal', grams: 150, kcal: 115, protein: 3, carbs: 25.5, fat: 0.2 },
          { size: 'large', grams: 200, kcal: 154, protein: 4, carbs: 34, fat: 0.2 },
          { size: 'extra', grams: 300, kcal: 231, protein: 6, carbs: 51, fat: 0.3 },
        ],
        per100g: { kcal: 77, protein: 2, carbs: 17, fat: 0.1 },
      },
      {
        id: 'potatismos',
        name: 'Potatismos',
        portions: [
          { size: 'small', grams: 100, kcal: 90, protein: 2, carbs: 14, fat: 3 },
          { size: 'normal', grams: 150, kcal: 135, protein: 3, carbs: 21, fat: 4.5 },
          { size: 'large', grams: 200, kcal: 180, protein: 4, carbs: 28, fat: 6 },
          { size: 'extra', grams: 300, kcal: 270, protein: 6, carbs: 42, fat: 9 },
        ],
        per100g: { kcal: 90, protein: 2, carbs: 14, fat: 3 },
      },
      {
        id: 'stekt_potatis',
        name: 'Stekt potatis',
        portions: [
          { size: 'small', grams: 100, kcal: 150, protein: 2, carbs: 20, fat: 7 },
          { size: 'normal', grams: 150, kcal: 225, protein: 3, carbs: 30, fat: 10.5 },
          { size: 'large', grams: 200, kcal: 300, protein: 4, carbs: 40, fat: 14 },
        ],
        per100g: { kcal: 150, protein: 2, carbs: 20, fat: 7 },
      },
      {
        id: 'gratang_potatis',
        name: 'Potatisgratäng',
        portions: [
          { size: 'small', grams: 120, kcal: 180, protein: 4, carbs: 16, fat: 11 },
          { size: 'normal', grams: 180, kcal: 270, protein: 6, carbs: 24, fat: 16.5 },
          { size: 'large', grams: 250, kcal: 375, protein: 8, carbs: 33, fat: 23 },
        ],
        per100g: { kcal: 150, protein: 3.3, carbs: 13, fat: 9 },
      },
      {
        id: 'pommes',
        name: 'Pommes frites',
        portions: [
          { size: 'small', grams: 80, kcal: 232, protein: 3, carbs: 28, fat: 12 },
          { size: 'normal', grams: 120, kcal: 348, protein: 4.5, carbs: 42, fat: 18 },
          { size: 'large', grams: 180, kcal: 522, protein: 7, carbs: 63, fat: 27 },
        ],
        per100g: { kcal: 290, protein: 3.5, carbs: 35, fat: 15 },
      },
      {
        id: 'klyftpotatis',
        name: 'Klyftpotatis (ugn)',
        portions: [
          { size: 'small', grams: 100, kcal: 110, protein: 2, carbs: 18, fat: 3.5 },
          { size: 'normal', grams: 150, kcal: 165, protein: 3, carbs: 27, fat: 5.3 },
          { size: 'large', grams: 200, kcal: 220, protein: 4, carbs: 36, fat: 7 },
        ],
        per100g: { kcal: 110, protein: 2, carbs: 18, fat: 3.5 },
      },
      // RIS & PASTA
      {
        id: 'ris_kokt',
        name: 'Kokt ris',
        portions: [
          { size: 'small', grams: 100, kcal: 130, protein: 2.5, carbs: 28, fat: 0.3 },
          { size: 'normal', grams: 150, kcal: 195, protein: 3.8, carbs: 42, fat: 0.5 },
          { size: 'large', grams: 200, kcal: 260, protein: 5, carbs: 56, fat: 0.6 },
          { size: 'extra', grams: 300, kcal: 390, protein: 7.5, carbs: 84, fat: 0.9 },
        ],
        per100g: { kcal: 130, protein: 2.5, carbs: 28, fat: 0.3 },
      },
      {
        id: 'pasta_kokt',
        name: 'Kokt pasta',
        portions: [
          { size: 'small', grams: 100, kcal: 131, protein: 5, carbs: 25, fat: 1 },
          { size: 'normal', grams: 150, kcal: 197, protein: 7.5, carbs: 37.5, fat: 1.5 },
          { size: 'large', grams: 200, kcal: 262, protein: 10, carbs: 50, fat: 2 },
          { size: 'extra', grams: 300, kcal: 393, protein: 15, carbs: 75, fat: 3 },
        ],
        per100g: { kcal: 131, protein: 5, carbs: 25, fat: 1 },
      },
      {
        id: 'makaroner',
        name: 'Makaroner (kokt)',
        portions: [
          { size: 'small', grams: 100, kcal: 131, protein: 5, carbs: 25, fat: 1 },
          { size: 'normal', grams: 150, kcal: 197, protein: 7.5, carbs: 37.5, fat: 1.5 },
          { size: 'large', grams: 200, kcal: 262, protein: 10, carbs: 50, fat: 2 },
        ],
        per100g: { kcal: 131, protein: 5, carbs: 25, fat: 1 },
      },
      {
        id: 'spagetti',
        name: 'Spagetti (kokt)',
        portions: [
          { size: 'small', grams: 100, kcal: 131, protein: 5, carbs: 25, fat: 1 },
          { size: 'normal', grams: 150, kcal: 197, protein: 7.5, carbs: 37.5, fat: 1.5 },
          { size: 'large', grams: 200, kcal: 262, protein: 10, carbs: 50, fat: 2 },
        ],
        per100g: { kcal: 131, protein: 5, carbs: 25, fat: 1 },
      },
      {
        id: 'couscous',
        name: 'Couscous (kokt)',
        portions: [
          { size: 'small', grams: 100, kcal: 112, protein: 4, carbs: 23, fat: 0.2 },
          { size: 'normal', grams: 150, kcal: 168, protein: 6, carbs: 34.5, fat: 0.3 },
          { size: 'large', grams: 200, kcal: 224, protein: 8, carbs: 46, fat: 0.4 },
        ],
        per100g: { kcal: 112, protein: 4, carbs: 23, fat: 0.2 },
      },
      {
        id: 'bulgur',
        name: 'Bulgur (kokt)',
        portions: [
          { size: 'small', grams: 100, kcal: 83, protein: 3, carbs: 18, fat: 0.2 },
          { size: 'normal', grams: 150, kcal: 125, protein: 4.5, carbs: 27, fat: 0.3 },
          { size: 'large', grams: 200, kcal: 166, protein: 6, carbs: 36, fat: 0.4 },
        ],
        per100g: { kcal: 83, protein: 3, carbs: 18, fat: 0.2 },
      },
      // BRÖD
      {
        id: 'brod_ljust',
        name: 'Ljust bröd (skiva)',
        portions: [
          { size: 'small', grams: 25, kcal: 62, protein: 2, carbs: 12, fat: 0.8 },
          { size: 'normal', grams: 40, kcal: 100, protein: 3.2, carbs: 19, fat: 1.3 },
          { size: 'large', grams: 60, kcal: 150, protein: 4.8, carbs: 28.5, fat: 2 },
        ],
        per100g: { kcal: 250, protein: 8, carbs: 48, fat: 3.2 },
      },
      {
        id: 'brod_morkt',
        name: 'Mörkt bröd (skiva)',
        portions: [
          { size: 'small', grams: 30, kcal: 66, protein: 2.4, carbs: 12, fat: 1 },
          { size: 'normal', grams: 50, kcal: 110, protein: 4, carbs: 20, fat: 1.7 },
          { size: 'large', grams: 75, kcal: 165, protein: 6, carbs: 30, fat: 2.5 },
        ],
        per100g: { kcal: 220, protein: 8, carbs: 40, fat: 3.3 },
      },
      {
        id: 'knackebrod',
        name: 'Knäckebröd',
        portions: [
          { size: 'small', grams: 12, kcal: 41, protein: 1.2, carbs: 8, fat: 0.5 },
          { size: 'normal', grams: 24, kcal: 82, protein: 2.4, carbs: 16, fat: 1 },
          { size: 'large', grams: 36, kcal: 123, protein: 3.6, carbs: 24, fat: 1.5 },
        ],
        per100g: { kcal: 340, protein: 10, carbs: 66, fat: 4 },
      },
      // ÖVRIGT
      {
        id: 'pannkaka',
        name: 'Pannkaka',
        portions: [
          { size: 'small', grams: 60, kcal: 96, protein: 4, carbs: 12, fat: 4 },
          { size: 'normal', grams: 120, kcal: 192, protein: 8, carbs: 24, fat: 8 },
          { size: 'large', grams: 180, kcal: 288, protein: 12, carbs: 36, fat: 12 },
        ],
        per100g: { kcal: 160, protein: 6.5, carbs: 20, fat: 6.5 },
      },
      {
        id: 'raggmunk',
        name: 'Raggmunk',
        portions: [
          { size: 'small', grams: 80, kcal: 136, protein: 3, carbs: 15, fat: 7.5 },
          { size: 'normal', grams: 120, kcal: 204, protein: 4.5, carbs: 22.5, fat: 11 },
          { size: 'large', grams: 180, kcal: 306, protein: 7, carbs: 34, fat: 16.5 },
        ],
        per100g: { kcal: 170, protein: 3.7, carbs: 19, fat: 9.2 },
      },
      {
        id: 'sotpotatis',
        name: 'Sötpotatis (kokt)',
        portions: [
          { size: 'small', grams: 100, kcal: 86, protein: 1.6, carbs: 20, fat: 0.1 },
          { size: 'normal', grams: 150, kcal: 129, protein: 2.4, carbs: 30, fat: 0.2 },
          { size: 'large', grams: 200, kcal: 172, protein: 3.2, carbs: 40, fat: 0.2 },
        ],
        per100g: { kcal: 86, protein: 1.6, carbs: 20, fat: 0.1 },
      },
    ],
  },

  // NY KATEGORI: FETTKÄLLA
  fat: {
    icon: '🧈',
    label: 'Fettkälla',
    color: 'yellow',
    commonItems: [
      {
        id: 'smor',
        name: 'Smör',
        portions: [
          { size: 'small', grams: 5, kcal: 37, protein: 0, carbs: 0, fat: 4.1 },
          { size: 'normal', grams: 10, kcal: 74, protein: 0, carbs: 0, fat: 8.2 },
          { size: 'large', grams: 15, kcal: 111, protein: 0, carbs: 0, fat: 12.3 },
        ],
        per100g: { kcal: 740, protein: 0.5, carbs: 0.5, fat: 82 },
      },
      {
        id: 'olivolja',
        name: 'Olivolja',
        portions: [
          { size: 'small', grams: 5, kcal: 44, protein: 0, carbs: 0, fat: 5 },
          { size: 'normal', grams: 10, kcal: 88, protein: 0, carbs: 0, fat: 10 },
          { size: 'large', grams: 15, kcal: 132, protein: 0, carbs: 0, fat: 15 },
        ],
        per100g: { kcal: 884, protein: 0, carbs: 0, fat: 100 },
      },
      {
        id: 'matolja',
        name: 'Matolja (raps/solros)',
        portions: [
          { size: 'small', grams: 5, kcal: 44, protein: 0, carbs: 0, fat: 5 },
          { size: 'normal', grams: 10, kcal: 88, protein: 0, carbs: 0, fat: 10 },
          { size: 'large', grams: 15, kcal: 132, protein: 0, carbs: 0, fat: 15 },
        ],
        per100g: { kcal: 884, protein: 0, carbs: 0, fat: 100 },
      },
      {
        id: 'avokado',
        name: 'Avokado',
        portions: [
          { size: 'small', grams: 50, kcal: 80, protein: 1, carbs: 4, fat: 7.5 },
          { size: 'normal', grams: 100, kcal: 160, protein: 2, carbs: 8, fat: 15 },
          { size: 'large', grams: 150, kcal: 240, protein: 3, carbs: 12, fat: 22.5 },
        ],
        per100g: { kcal: 160, protein: 2, carbs: 8, fat: 15 },
      },
      {
        id: 'notter',
        name: 'Nötter (blandade)',
        portions: [
          { size: 'small', grams: 15, kcal: 90, protein: 2.5, carbs: 3, fat: 8 },
          { size: 'normal', grams: 30, kcal: 180, protein: 5, carbs: 6, fat: 16 },
          { size: 'large', grams: 50, kcal: 300, protein: 8, carbs: 10, fat: 27 },
        ],
        per100g: { kcal: 607, protein: 17, carbs: 20, fat: 54 },
      },
      {
        id: 'mandlar',
        name: 'Mandlar',
        portions: [
          { size: 'small', grams: 15, kcal: 87, protein: 3, carbs: 3, fat: 7.5 },
          { size: 'normal', grams: 30, kcal: 174, protein: 6, carbs: 6, fat: 15 },
          { size: 'large', grams: 50, kcal: 290, protein: 10, carbs: 10, fat: 25 },
        ],
        per100g: { kcal: 580, protein: 21, carbs: 20, fat: 50 },
      },
      {
        id: 'ost_hard',
        name: 'Ost (hårdost)',
        portions: [
          { size: 'small', grams: 15, kcal: 55, protein: 4, carbs: 0, fat: 4.5 },
          { size: 'normal', grams: 30, kcal: 110, protein: 8, carbs: 0, fat: 9 },
          { size: 'large', grams: 50, kcal: 185, protein: 13, carbs: 0, fat: 15 },
        ],
        per100g: { kcal: 370, protein: 26, carbs: 0, fat: 30 },
      },
      {
        id: 'ost_mjuk',
        name: 'Ost (mjukost)',
        portions: [
          { size: 'small', grams: 20, kcal: 50, protein: 3, carbs: 1, fat: 4 },
          { size: 'normal', grams: 40, kcal: 100, protein: 6, carbs: 2, fat: 8 },
          { size: 'large', grams: 60, kcal: 150, protein: 9, carbs: 3, fat: 12 },
        ],
        per100g: { kcal: 250, protein: 15, carbs: 5, fat: 20 },
      },
      {
        id: 'gradde',
        name: 'Vispgrädde',
        portions: [
          { size: 'small', grams: 30, kcal: 114, protein: 0.6, carbs: 0.9, fat: 12 },
          { size: 'normal', grams: 50, kcal: 190, protein: 1, carbs: 1.5, fat: 20 },
          { size: 'large', grams: 100, kcal: 380, protein: 2, carbs: 3, fat: 40 },
        ],
        per100g: { kcal: 380, protein: 2, carbs: 3, fat: 40 },
      },
      {
        id: 'creme_fraiche',
        name: 'Crème fraiche',
        portions: [
          { size: 'small', grams: 30, kcal: 99, protein: 0.7, carbs: 0.9, fat: 10.5 },
          { size: 'normal', grams: 50, kcal: 165, protein: 1.2, carbs: 1.5, fat: 17.5 },
          { size: 'large', grams: 100, kcal: 330, protein: 2.4, carbs: 3, fat: 35 },
        ],
        per100g: { kcal: 330, protein: 2.4, carbs: 3, fat: 35 },
      },
      {
        id: 'majonnäs',
        name: 'Majonnäs',
        portions: [
          { size: 'small', grams: 15, kcal: 105, protein: 0.2, carbs: 0.5, fat: 11.5 },
          { size: 'normal', grams: 30, kcal: 210, protein: 0.4, carbs: 1, fat: 23 },
          { size: 'large', grams: 50, kcal: 350, protein: 0.7, carbs: 1.5, fat: 38 },
        ],
        per100g: { kcal: 700, protein: 1.3, carbs: 2.5, fat: 77 },
      },
      {
        id: 'graddfil',
        name: 'Gräddfil',
        portions: [
          { size: 'small', grams: 50, kcal: 55, protein: 1.5, carbs: 2, fat: 5 },
          { size: 'normal', grams: 100, kcal: 110, protein: 3, carbs: 4, fat: 10 },
          { size: 'large', grams: 150, kcal: 165, protein: 4.5, carbs: 6, fat: 15 },
        ],
        per100g: { kcal: 110, protein: 3, carbs: 4, fat: 10 },
      },
      {
        id: 'jordnotssmor',
        name: 'Jordnötssmör',
        portions: [
          { size: 'small', grams: 15, kcal: 92, protein: 4, carbs: 2.5, fat: 7.5 },
          { size: 'normal', grams: 30, kcal: 184, protein: 8, carbs: 5, fat: 15 },
          { size: 'large', grams: 50, kcal: 307, protein: 13, carbs: 8, fat: 25 },
        ],
        per100g: { kcal: 614, protein: 26, carbs: 16, fat: 50 },
      },
    ],
  },

  vegetable: {
    icon: '🥗',
    label: 'Grönsaker',
    color: 'green',
    commonItems: [
      {
        id: 'sallad_blandad',
        name: 'Blandad sallad',
        portions: [
          { size: 'small', grams: 50, kcal: 10, protein: 0.5, carbs: 1.5, fat: 0.1 },
          { size: 'normal', grams: 100, kcal: 20, protein: 1, carbs: 3, fat: 0.2 },
          { size: 'large', grams: 150, kcal: 30, protein: 1.5, carbs: 4.5, fat: 0.3 },
        ],
        per100g: { kcal: 20, protein: 1, carbs: 3, fat: 0.2 },
      },
      {
        id: 'broccoli',
        name: 'Broccoli',
        portions: [
          { size: 'small', grams: 50, kcal: 17, protein: 1.5, carbs: 2, fat: 0.2 },
          { size: 'normal', grams: 100, kcal: 34, protein: 3, carbs: 4, fat: 0.4 },
          { size: 'large', grams: 150, kcal: 51, protein: 4.5, carbs: 6, fat: 0.6 },
        ],
        per100g: { kcal: 34, protein: 3, carbs: 4, fat: 0.4 },
      },
      {
        id: 'morotter',
        name: 'Morötter',
        portions: [
          { size: 'small', grams: 50, kcal: 20, protein: 0.5, carbs: 4, fat: 0.1 },
          { size: 'normal', grams: 100, kcal: 40, protein: 1, carbs: 8, fat: 0.2 },
          { size: 'large', grams: 150, kcal: 60, protein: 1.5, carbs: 12, fat: 0.3 },
        ],
        per100g: { kcal: 40, protein: 1, carbs: 8, fat: 0.2 },
      },
      {
        id: 'blomkal',
        name: 'Blomkål',
        portions: [
          { size: 'small', grams: 50, kcal: 12, protein: 1, carbs: 1.5, fat: 0.1 },
          { size: 'normal', grams: 100, kcal: 24, protein: 2, carbs: 3, fat: 0.2 },
          { size: 'large', grams: 150, kcal: 36, protein: 3, carbs: 4.5, fat: 0.3 },
        ],
        per100g: { kcal: 24, protein: 2, carbs: 3, fat: 0.2 },
      },
      {
        id: 'haricots_verts',
        name: 'Haricots verts',
        portions: [
          { size: 'small', grams: 50, kcal: 15, protein: 1, carbs: 2.5, fat: 0.1 },
          { size: 'normal', grams: 100, kcal: 30, protein: 2, carbs: 5, fat: 0.2 },
          { size: 'large', grams: 150, kcal: 45, protein: 3, carbs: 7.5, fat: 0.3 },
        ],
        per100g: { kcal: 30, protein: 2, carbs: 5, fat: 0.2 },
      },
      {
        id: 'artor',
        name: 'Ärtor',
        portions: [
          { size: 'small', grams: 50, kcal: 40, protein: 2.5, carbs: 6, fat: 0.2 },
          { size: 'normal', grams: 100, kcal: 80, protein: 5, carbs: 12, fat: 0.4 },
          { size: 'large', grams: 150, kcal: 120, protein: 7.5, carbs: 18, fat: 0.6 },
        ],
        per100g: { kcal: 80, protein: 5, carbs: 12, fat: 0.4 },
      },
      {
        id: 'majs',
        name: 'Majs',
        portions: [
          { size: 'small', grams: 50, kcal: 44, protein: 1.5, carbs: 9, fat: 0.5 },
          { size: 'normal', grams: 100, kcal: 88, protein: 3, carbs: 18, fat: 1 },
          { size: 'large', grams: 150, kcal: 132, protein: 4.5, carbs: 27, fat: 1.5 },
        ],
        per100g: { kcal: 88, protein: 3, carbs: 18, fat: 1 },
      },
      {
        id: 'tomat',
        name: 'Tomat',
        portions: [
          { size: 'small', grams: 50, kcal: 9, protein: 0.4, carbs: 1.5, fat: 0.1 },
          { size: 'normal', grams: 100, kcal: 18, protein: 0.8, carbs: 3, fat: 0.2 },
          { size: 'large', grams: 150, kcal: 27, protein: 1.2, carbs: 4.5, fat: 0.3 },
        ],
        per100g: { kcal: 18, protein: 0.8, carbs: 3, fat: 0.2 },
      },
      {
        id: 'gurka',
        name: 'Gurka',
        portions: [
          { size: 'small', grams: 50, kcal: 6, protein: 0.3, carbs: 1, fat: 0.1 },
          { size: 'normal', grams: 100, kcal: 12, protein: 0.6, carbs: 2, fat: 0.1 },
          { size: 'large', grams: 150, kcal: 18, protein: 0.9, carbs: 3, fat: 0.2 },
        ],
        per100g: { kcal: 12, protein: 0.6, carbs: 2, fat: 0.1 },
      },
      {
        id: 'paprika',
        name: 'Paprika',
        portions: [
          { size: 'small', grams: 50, kcal: 13, protein: 0.5, carbs: 2.5, fat: 0.1 },
          { size: 'normal', grams: 100, kcal: 26, protein: 1, carbs: 5, fat: 0.2 },
          { size: 'large', grams: 150, kcal: 39, protein: 1.5, carbs: 7.5, fat: 0.3 },
        ],
        per100g: { kcal: 26, protein: 1, carbs: 5, fat: 0.2 },
      },
      {
        id: 'spenat',
        name: 'Spenat',
        portions: [
          { size: 'small', grams: 30, kcal: 7, protein: 0.9, carbs: 1, fat: 0.1 },
          { size: 'normal', grams: 60, kcal: 14, protein: 1.8, carbs: 2, fat: 0.2 },
          { size: 'large', grams: 100, kcal: 23, protein: 3, carbs: 3.5, fat: 0.4 },
        ],
        per100g: { kcal: 23, protein: 3, carbs: 3.5, fat: 0.4 },
      },
      {
        id: 'lok_stekt',
        name: 'Stekt lök',
        portions: [
          { size: 'small', grams: 30, kcal: 35, protein: 0.3, carbs: 3.5, fat: 2 },
          { size: 'normal', grams: 50, kcal: 58, protein: 0.5, carbs: 6, fat: 3.5 },
          { size: 'large', grams: 80, kcal: 93, protein: 0.8, carbs: 9.5, fat: 5.5 },
        ],
        per100g: { kcal: 116, protein: 1, carbs: 12, fat: 7 },
      },
      {
        id: 'rodbetor',
        name: 'Rödbetor (inlagda)',
        portions: [
          { size: 'small', grams: 40, kcal: 24, protein: 0.5, carbs: 5, fat: 0 },
          { size: 'normal', grams: 80, kcal: 48, protein: 1, carbs: 10, fat: 0 },
          { size: 'large', grams: 120, kcal: 72, protein: 1.5, carbs: 15, fat: 0 },
        ],
        per100g: { kcal: 60, protein: 1.2, carbs: 13, fat: 0 },
      },
      {
        id: 'zucchini',
        name: 'Zucchini',
        portions: [
          { size: 'small', grams: 50, kcal: 8, protein: 0.6, carbs: 1.2, fat: 0.2 },
          { size: 'normal', grams: 100, kcal: 16, protein: 1.2, carbs: 2.4, fat: 0.4 },
          { size: 'large', grams: 150, kcal: 24, protein: 1.8, carbs: 3.6, fat: 0.6 },
        ],
        per100g: { kcal: 16, protein: 1.2, carbs: 2.4, fat: 0.4 },
      },
      {
        id: 'wokgront',
        name: 'Wokgrönsaker (mix)',
        portions: [
          { size: 'small', grams: 80, kcal: 24, protein: 1.5, carbs: 4, fat: 0.3 },
          { size: 'normal', grams: 150, kcal: 45, protein: 2.8, carbs: 7.5, fat: 0.6 },
          { size: 'large', grams: 200, kcal: 60, protein: 3.8, carbs: 10, fat: 0.8 },
        ],
        per100g: { kcal: 30, protein: 1.9, carbs: 5, fat: 0.4 },
      },
    ],
  },

  sauce: {
    icon: '🫗',
    label: 'Sås/Tillbehör',
    color: 'orange',
    commonItems: [
      {
        id: 'graddsas',
        name: 'Gräddsås',
        portions: [
          { size: 'small', grams: 50, kcal: 85, protein: 1.5, carbs: 3, fat: 7.5 },
          { size: 'normal', grams: 80, kcal: 136, protein: 2.4, carbs: 4.8, fat: 12 },
          { size: 'large', grams: 120, kcal: 204, protein: 3.6, carbs: 7.2, fat: 18 },
        ],
        per100g: { kcal: 170, protein: 3, carbs: 6, fat: 15 },
      },
      {
        id: 'brunsas',
        name: 'Brunsås',
        portions: [
          { size: 'small', grams: 50, kcal: 30, protein: 0.5, carbs: 5, fat: 1 },
          { size: 'normal', grams: 80, kcal: 48, protein: 0.8, carbs: 8, fat: 1.6 },
          { size: 'large', grams: 120, kcal: 72, protein: 1.2, carbs: 12, fat: 2.4 },
        ],
        per100g: { kcal: 60, protein: 1, carbs: 10, fat: 2 },
      },
      {
        id: 'vitsas',
        name: 'Vit sås/Béchamel',
        portions: [
          { size: 'small', grams: 50, kcal: 70, protein: 1.5, carbs: 5, fat: 5 },
          { size: 'normal', grams: 80, kcal: 112, protein: 2.4, carbs: 8, fat: 8 },
          { size: 'large', grams: 120, kcal: 168, protein: 3.6, carbs: 12, fat: 12 },
        ],
        per100g: { kcal: 140, protein: 3, carbs: 10, fat: 10 },
      },
      {
        id: 'tomatsas',
        name: 'Tomatsås',
        portions: [
          { size: 'small', grams: 50, kcal: 25, protein: 0.5, carbs: 4, fat: 1 },
          { size: 'normal', grams: 100, kcal: 50, protein: 1, carbs: 8, fat: 2 },
          { size: 'large', grams: 150, kcal: 75, protein: 1.5, carbs: 12, fat: 3 },
        ],
        per100g: { kcal: 50, protein: 1, carbs: 8, fat: 2 },
      },
      {
        id: 'pesto',
        name: 'Pesto',
        portions: [
          { size: 'small', grams: 15, kcal: 75, protein: 1.5, carbs: 1, fat: 7.5 },
          { size: 'normal', grams: 30, kcal: 150, protein: 3, carbs: 2, fat: 15 },
          { size: 'large', grams: 50, kcal: 250, protein: 5, carbs: 3, fat: 25 },
        ],
        per100g: { kcal: 500, protein: 10, carbs: 5, fat: 50 },
      },
      {
        id: 'bearnaise',
        name: 'Bearnaisesås',
        portions: [
          { size: 'small', grams: 30, kcal: 180, protein: 0.5, carbs: 0.5, fat: 20 },
          { size: 'normal', grams: 50, kcal: 300, protein: 0.8, carbs: 0.8, fat: 33 },
          { size: 'large', grams: 80, kcal: 480, protein: 1.3, carbs: 1.3, fat: 53 },
        ],
        per100g: { kcal: 600, protein: 1.6, carbs: 1.6, fat: 66 },
      },
      {
        id: 'lingonsylt',
        name: 'Lingonsylt',
        portions: [
          { size: 'small', grams: 20, kcal: 30, protein: 0, carbs: 7.5, fat: 0 },
          { size: 'normal', grams: 40, kcal: 60, protein: 0, carbs: 15, fat: 0 },
          { size: 'large', grams: 60, kcal: 90, protein: 0, carbs: 22.5, fat: 0 },
        ],
        per100g: { kcal: 150, protein: 0.2, carbs: 37, fat: 0.1 },
      },
      {
        id: 'senap',
        name: 'Senap',
        portions: [
          { size: 'small', grams: 10, kcal: 8, protein: 0.5, carbs: 0.5, fat: 0.5 },
          { size: 'normal', grams: 20, kcal: 16, protein: 1, carbs: 1, fat: 1 },
          { size: 'large', grams: 30, kcal: 24, protein: 1.5, carbs: 1.5, fat: 1.5 },
        ],
        per100g: { kcal: 80, protein: 5, carbs: 5, fat: 5 },
      },
      {
        id: 'ketchup',
        name: 'Ketchup',
        portions: [
          { size: 'small', grams: 15, kcal: 17, protein: 0.2, carbs: 4, fat: 0 },
          { size: 'normal', grams: 30, kcal: 34, protein: 0.4, carbs: 8, fat: 0 },
          { size: 'large', grams: 50, kcal: 57, protein: 0.6, carbs: 13, fat: 0 },
        ],
        per100g: { kcal: 113, protein: 1.2, carbs: 26, fat: 0.1 },
      },
      {
        id: 'aioli',
        name: 'Aioli',
        portions: [
          { size: 'small', grams: 20, kcal: 130, protein: 0.4, carbs: 1, fat: 14 },
          { size: 'normal', grams: 40, kcal: 260, protein: 0.8, carbs: 2, fat: 28 },
          { size: 'large', grams: 60, kcal: 390, protein: 1.2, carbs: 3, fat: 42 },
        ],
        per100g: { kcal: 650, protein: 2, carbs: 5, fat: 70 },
      },
      {
        id: 'tzatziki',
        name: 'Tzatziki',
        portions: [
          { size: 'small', grams: 40, kcal: 36, protein: 1.6, carbs: 2, fat: 2.4 },
          { size: 'normal', grams: 80, kcal: 72, protein: 3.2, carbs: 4, fat: 4.8 },
          { size: 'large', grams: 120, kcal: 108, protein: 4.8, carbs: 6, fat: 7.2 },
        ],
        per100g: { kcal: 90, protein: 4, carbs: 5, fat: 6 },
      },
      {
        id: 'remouladsas',
        name: 'Remouladsås',
        portions: [
          { size: 'small', grams: 25, kcal: 120, protein: 0.3, carbs: 2, fat: 12 },
          { size: 'normal', grams: 50, kcal: 240, protein: 0.6, carbs: 4, fat: 24 },
          { size: 'large', grams: 75, kcal: 360, protein: 0.9, carbs: 6, fat: 36 },
        ],
        per100g: { kcal: 480, protein: 1.2, carbs: 8, fat: 48 },
      },
      {
        id: 'sojasas',
        name: 'Sojasås',
        portions: [
          { size: 'small', grams: 10, kcal: 5, protein: 0.8, carbs: 0.5, fat: 0 },
          { size: 'normal', grams: 20, kcal: 10, protein: 1.6, carbs: 1, fat: 0 },
          { size: 'large', grams: 30, kcal: 15, protein: 2.4, carbs: 1.5, fat: 0 },
        ],
        per100g: { kcal: 50, protein: 8, carbs: 5, fat: 0 },
      },
      {
        id: 'sweet_chili',
        name: 'Sweet chili sås',
        portions: [
          { size: 'small', grams: 20, kcal: 36, protein: 0.1, carbs: 8.5, fat: 0 },
          { size: 'normal', grams: 40, kcal: 72, protein: 0.2, carbs: 17, fat: 0 },
          { size: 'large', grams: 60, kcal: 108, protein: 0.3, carbs: 25.5, fat: 0 },
        ],
        per100g: { kcal: 180, protein: 0.5, carbs: 42, fat: 0.1 },
      },
    ],
  },
};

// Helper function to get food item by ID
export function getFoodItemById(
  category: QuickTrackCategory,
  itemId: string
): QuickTrackFoodItem | undefined {
  return QUICK_TRACK_CATEGORIES[category].commonItems.find(
    (item) => item.id === itemId
  );
}

// Helper function to calculate nutrition for a custom gram amount
export function calculateCustomPortion(
  item: QuickTrackFoodItem,
  grams: number
): { kcal: number; protein: number; carbs: number; fat: number } {
  const multiplier = grams / 100;
  return {
    kcal: Math.round(item.per100g.kcal * multiplier),
    protein: Math.round(item.per100g.protein * multiplier * 10) / 10,
    carbs: Math.round(item.per100g.carbs * multiplier * 10) / 10,
    fat: Math.round(item.per100g.fat * multiplier * 10) / 10,
  };
}

// Get all categories as array for iteration
export function getCategoriesArray() {
  return Object.entries(QUICK_TRACK_CATEGORIES).map(([key, value]) => ({
    id: key as QuickTrackCategory,
    ...value,
  }));
}
