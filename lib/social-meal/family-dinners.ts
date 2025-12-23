import type { FamilyDinnerPreset } from './types';

// Comprehensive list of Swedish family dinner presets
// Organized by category for easy navigation

export const FAMILY_DINNER_PRESETS: FamilyDinnerPreset[] = [
  // ==========================================
  // KLASSISK HUSMANSKOST
  // ==========================================
  {
    id: 'kottbullar_komplett',
    name: 'Köttbullar med mos',
    description: 'Klassiker med gräddsås och lingon',
    components: [
      { categoryId: 'protein', itemId: 'kottbullar', portion: 'normal' },
      { categoryId: 'carb', itemId: 'potatismos', portion: 'normal' },
      { categoryId: 'sauce', itemId: 'graddsas', portion: 'normal' },
      { categoryId: 'sauce', itemId: 'lingonsylt', portion: 'normal' },
    ],
    totalNutrition: { kcal: 658, protein: 26, carbs: 49, fat: 40 },
    tags: ['husmanskost', 'klassiker', 'barnfavorit'],
  },
  {
    id: 'pannbiff_lok',
    name: 'Pannbiff med lök',
    description: 'Stekt pannbiff med brynt lök och potatis',
    components: [
      { categoryId: 'protein', itemId: 'pannbiff', portion: 'normal' },
      { categoryId: 'carb', itemId: 'potatis_kokt', portion: 'normal' },
      { categoryId: 'vegetable', itemId: 'lok_stekt', portion: 'normal' },
      { categoryId: 'sauce', itemId: 'brunsas', portion: 'normal' },
    ],
    totalNutrition: { kcal: 521, protein: 30, carbs: 40, fat: 27 },
    tags: ['husmanskost', 'klassiker'],
  },
  {
    id: 'falukorv_stuvade',
    name: 'Falukorv med stuvade makaroner',
    description: 'Barnfavorit med gräddig pasta',
    components: [
      { categoryId: 'protein', itemId: 'falukorv', portion: 'normal' },
      { categoryId: 'carb', itemId: 'makaroner', portion: 'normal' },
      { categoryId: 'sauce', itemId: 'vitsas', portion: 'normal' },
    ],
    totalNutrition: { kcal: 597, protein: 23, carbs: 54, fat: 32 },
    tags: ['husmanskost', 'barnfavorit', 'snabb'],
  },
  {
    id: 'korv_stroganoff',
    name: 'Korv Stroganoff',
    description: 'Med ris och gurka',
    components: [
      { categoryId: 'protein', itemId: 'korv_stroganoff', portion: 'normal' },
      { categoryId: 'carb', itemId: 'ris_kokt', portion: 'normal' },
      { categoryId: 'vegetable', itemId: 'gurka', portion: 'normal' },
    ],
    totalNutrition: { kcal: 657, protein: 19, carbs: 60, fat: 37 },
    tags: ['husmanskost', 'snabb', 'barnfavorit'],
  },
  {
    id: 'kotfarssas_spagetti',
    name: 'Köttfärssås med spagetti',
    description: 'Klassisk pasta bolognese',
    components: [
      { categoryId: 'protein', itemId: 'kotfarssas', portion: 'normal' },
      { categoryId: 'carb', itemId: 'spagetti', portion: 'normal' },
      { categoryId: 'fat', itemId: 'ost_hard', portion: 'small' },
    ],
    totalNutrition: { kcal: 492, protein: 28, carbs: 50, fat: 20 },
    tags: ['husmanskost', 'pasta', 'barnfavorit'],
  },
  {
    id: 'pytt_panna',
    name: 'Pytt i panna',
    description: 'Med stekt ägg och rödbetor',
    components: [
      { categoryId: 'protein', itemId: 'kotfars', portion: 'small' },
      { categoryId: 'carb', itemId: 'stekt_potatis', portion: 'normal' },
      { categoryId: 'protein', itemId: 'agg_stekt', portion: 'normal' },
      { categoryId: 'vegetable', itemId: 'rodbetor', portion: 'normal' },
    ],
    totalNutrition: { kcal: 657, protein: 32, carbs: 48, fat: 38 },
    tags: ['husmanskost', 'klassiker'],
  },
  {
    id: 'kalops',
    name: 'Kalops',
    description: 'Med kokt potatis och rödbetor',
    components: [
      { categoryId: 'protein', itemId: 'kalops', portion: 'normal' },
      { categoryId: 'carb', itemId: 'potatis_kokt', portion: 'normal' },
      { categoryId: 'vegetable', itemId: 'rodbetor', portion: 'normal' },
    ],
    totalNutrition: { kcal: 463, protein: 30, carbs: 50, fat: 15 },
    tags: ['husmanskost', 'gryta', 'klassiker'],
  },
  {
    id: 'raggmunkar',
    name: 'Raggmunkar med fläsk',
    description: 'Med stekt fläsk och lingon',
    components: [
      { categoryId: 'carb', itemId: 'raggmunk', portion: 'large' },
      { categoryId: 'protein', itemId: 'bacon', portion: 'normal' },
      { categoryId: 'sauce', itemId: 'lingonsylt', portion: 'normal' },
    ],
    totalNutrition: { kcal: 581, protein: 20, carbs: 49, fat: 35 },
    tags: ['husmanskost', 'klassiker'],
  },
  {
    id: 'kaldolmar',
    name: 'Kåldolmar',
    description: 'Med kokt potatis och lingon',
    components: [
      { categoryId: 'protein', itemId: 'kottbullar', portion: 'normal' },
      { categoryId: 'carb', itemId: 'potatis_kokt', portion: 'normal' },
      { categoryId: 'sauce', itemId: 'graddsas', portion: 'normal' },
      { categoryId: 'sauce', itemId: 'lingonsylt', portion: 'normal' },
    ],
    totalNutrition: { kcal: 655, protein: 28, carbs: 51, fat: 38 },
    tags: ['husmanskost', 'klassiker'],
  },
  {
    id: 'artsoppa_pannkaka',
    name: 'Ärtsoppa med pannkaka',
    description: 'Torsdagsklassikern',
    components: [
      { categoryId: 'vegetable', itemId: 'artor', portion: 'large' },
      { categoryId: 'protein', itemId: 'kassler', portion: 'small' },
      { categoryId: 'carb', itemId: 'pannkaka', portion: 'normal' },
      { categoryId: 'sauce', itemId: 'lingonsylt', portion: 'small' },
    ],
    totalNutrition: { kcal: 478, protein: 27, carbs: 54, fat: 17 },
    tags: ['husmanskost', 'klassiker', 'torsdag'],
  },
  {
    id: 'janssons_frestelse',
    name: 'Janssons frestelse',
    description: 'Klassisk potatisgratäng med ansjovis',
    components: [
      { categoryId: 'carb', itemId: 'gratang_potatis', portion: 'large' },
      { categoryId: 'fat', itemId: 'gradde', portion: 'small' },
      { categoryId: 'vegetable', itemId: 'lok_stekt', portion: 'normal' },
    ],
    totalNutrition: { kcal: 547, protein: 11, carbs: 42, fat: 38 },
    tags: ['husmanskost', 'jul', 'klassiker'],
  },
  {
    id: 'flygande_jacob',
    name: 'Flygande Jacob',
    description: 'Kyckling med bacon, banan och curry',
    components: [
      { categoryId: 'protein', itemId: 'kycklingfile', portion: 'normal' },
      { categoryId: 'protein', itemId: 'bacon', portion: 'small' },
      { categoryId: 'carb', itemId: 'ris_kokt', portion: 'normal' },
      { categoryId: 'fat', itemId: 'creme_fraiche', portion: 'normal' },
    ],
    totalNutrition: { kcal: 689, protein: 52, carbs: 46, fat: 33 },
    tags: ['husmanskost', 'retro', '80tal'],
  },
  {
    id: 'sillmiddag',
    name: 'Sillmiddag',
    description: 'Inlagd sill med potatis och ägg',
    components: [
      { categoryId: 'protein', itemId: 'sill', portion: 'normal' },
      { categoryId: 'carb', itemId: 'potatis_kokt', portion: 'normal' },
      { categoryId: 'protein', itemId: 'agg_kokt', portion: 'normal' },
      { categoryId: 'fat', itemId: 'graddfil', portion: 'normal' },
    ],
    totalNutrition: { kcal: 513, protein: 35, carbs: 32, fat: 28 },
    tags: ['husmanskost', 'fisk', 'midsommar'],
  },
  {
    id: 'blodpudding',
    name: 'Blodpudding med fläsk',
    description: 'Med lingonsylt och bacon',
    components: [
      { categoryId: 'carb', itemId: 'pannkaka', portion: 'large' },
      { categoryId: 'protein', itemId: 'bacon', portion: 'normal' },
      { categoryId: 'sauce', itemId: 'lingonsylt', portion: 'large' },
    ],
    totalNutrition: { kcal: 593, protein: 26, carbs: 58, fat: 29 },
    tags: ['husmanskost', 'klassiker'],
  },

  // ==========================================
  // FISK & SKALDJUR
  // ==========================================
  {
    id: 'lax_potatis',
    name: 'Ugnsbakad lax',
    description: 'Med kokt potatis och dillsås',
    components: [
      { categoryId: 'protein', itemId: 'lax', portion: 'normal' },
      { categoryId: 'carb', itemId: 'potatis_kokt', portion: 'normal' },
      { categoryId: 'sauce', itemId: 'vitsas', portion: 'normal' },
      { categoryId: 'vegetable', itemId: 'broccoli', portion: 'normal' },
    ],
    totalNutrition: { kcal: 520, protein: 37, carbs: 35, fat: 26 },
    tags: ['fisk', 'hälsosam', 'vardagsmat'],
  },
  {
    id: 'fiskpinnar',
    name: 'Fiskpinnar med mos',
    description: 'Med potatismos och remouladsås',
    components: [
      { categoryId: 'protein', itemId: 'fiskpinnar', portion: 'normal' },
      { categoryId: 'carb', itemId: 'potatismos', portion: 'normal' },
      { categoryId: 'sauce', itemId: 'remouladsas', portion: 'normal' },
      { categoryId: 'vegetable', itemId: 'artor', portion: 'normal' },
    ],
    totalNutrition: { kcal: 725, protein: 28, carbs: 61, fat: 41 },
    tags: ['fisk', 'barnfavorit', 'snabb'],
  },
  {
    id: 'stekt_stromming',
    name: 'Stekt strömming',
    description: 'Med potatismos och lingon',
    components: [
      { categoryId: 'protein', itemId: 'sill', portion: 'large' },
      { categoryId: 'carb', itemId: 'potatismos', portion: 'normal' },
      { categoryId: 'sauce', itemId: 'lingonsylt', portion: 'normal' },
    ],
    totalNutrition: { kcal: 411, protein: 23, carbs: 42, fat: 17 },
    tags: ['fisk', 'husmanskost'],
  },
  {
    id: 'torsk_aggsas',
    name: 'Kokt torsk med äggsås',
    description: 'Klassisk fiskrätt med potatis',
    components: [
      { categoryId: 'protein', itemId: 'torsk', portion: 'normal' },
      { categoryId: 'carb', itemId: 'potatis_kokt', portion: 'normal' },
      { categoryId: 'protein', itemId: 'agg_kokt', portion: 'small' },
      { categoryId: 'sauce', itemId: 'vitsas', portion: 'normal' },
    ],
    totalNutrition: { kcal: 463, protein: 43, carbs: 35, fat: 17 },
    tags: ['fisk', 'husmanskost', 'klassiker'],
  },
  {
    id: 'fiskgratang_komplett',
    name: 'Fiskgratäng',
    description: 'Med kokt potatis',
    components: [
      { categoryId: 'protein', itemId: 'fiskgratang', portion: 'normal' },
      { categoryId: 'carb', itemId: 'potatis_kokt', portion: 'normal' },
      { categoryId: 'vegetable', itemId: 'sallad_blandad', portion: 'normal' },
    ],
    totalNutrition: { kcal: 525, protein: 28, carbs: 52, fat: 22 },
    tags: ['fisk', 'gratäng', 'vardagsmat'],
  },
  {
    id: 'laxpasta',
    name: 'Laxpasta',
    description: 'Pasta med lax och gräddsås',
    components: [
      { categoryId: 'protein', itemId: 'lax', portion: 'normal' },
      { categoryId: 'carb', itemId: 'pasta_kokt', portion: 'normal' },
      { categoryId: 'fat', itemId: 'creme_fraiche', portion: 'normal' },
      { categoryId: 'vegetable', itemId: 'spenat', portion: 'normal' },
    ],
    totalNutrition: { kcal: 649, protein: 42, carbs: 41, fat: 35 },
    tags: ['fisk', 'pasta', 'snabb'],
  },
  {
    id: 'raksmorgasar',
    name: 'Räksmörgås',
    description: 'Klassisk räksmörgås med majonnäs',
    components: [
      { categoryId: 'protein', itemId: 'rakor', portion: 'normal' },
      { categoryId: 'carb', itemId: 'brod_ljust', portion: 'normal' },
      { categoryId: 'fat', itemId: 'majonnäs', portion: 'normal' },
      { categoryId: 'vegetable', itemId: 'sallad_blandad', portion: 'small' },
    ],
    totalNutrition: { kcal: 410, protein: 28, carbs: 22, fat: 24 },
    tags: ['skaldjur', 'lunch', 'smörgås'],
  },

  // ==========================================
  // MODERNA FAVORITER
  // ==========================================
  {
    id: 'tacos',
    name: 'Tacos (fredagsmys)',
    description: 'Med köttfärs, grönsaker och tillbehör',
    components: [
      { categoryId: 'protein', itemId: 'kotfars', portion: 'normal' },
      { categoryId: 'carb', itemId: 'brod_ljust', portion: 'normal' },
      { categoryId: 'vegetable', itemId: 'tomat', portion: 'normal' },
      { categoryId: 'vegetable', itemId: 'sallad_blandad', portion: 'normal' },
      { categoryId: 'fat', itemId: 'ost_hard', portion: 'normal' },
      { categoryId: 'fat', itemId: 'creme_fraiche', portion: 'normal' },
    ],
    totalNutrition: { kcal: 811, protein: 42, carbs: 34, fat: 57 },
    tags: ['modern', 'fredagsmys', 'barnfavorit'],
  },
  {
    id: 'lasagne',
    name: 'Lasagne',
    description: 'Klassisk köttlasagne',
    components: [
      { categoryId: 'protein', itemId: 'kotfarssas', portion: 'large' },
      { categoryId: 'carb', itemId: 'pasta_kokt', portion: 'normal' },
      { categoryId: 'sauce', itemId: 'vitsas', portion: 'normal' },
      { categoryId: 'fat', itemId: 'ost_hard', portion: 'normal' },
    ],
    totalNutrition: { kcal: 720, protein: 36, carbs: 56, fat: 39 },
    tags: ['pasta', 'italienskt', 'klassiker'],
  },
  {
    id: 'kycklingfile_ris',
    name: 'Kyckling med ris',
    description: 'Kycklingfilé med ris och sås',
    components: [
      { categoryId: 'protein', itemId: 'kycklingfile', portion: 'normal' },
      { categoryId: 'carb', itemId: 'ris_kokt', portion: 'normal' },
      { categoryId: 'sauce', itemId: 'graddsas', portion: 'normal' },
      { categoryId: 'vegetable', itemId: 'broccoli', portion: 'normal' },
    ],
    totalNutrition: { kcal: 530, protein: 43, carbs: 50, fat: 18 },
    tags: ['kyckling', 'vardagsmat', 'hälsosam'],
  },
  {
    id: 'thai_wok',
    name: 'Wok med kyckling',
    description: 'Med ris och wokgrönsaker',
    components: [
      { categoryId: 'protein', itemId: 'kycklingfile', portion: 'normal' },
      { categoryId: 'carb', itemId: 'ris_kokt', portion: 'normal' },
      { categoryId: 'vegetable', itemId: 'wokgront', portion: 'normal' },
      { categoryId: 'fat', itemId: 'matolja', portion: 'normal' },
      { categoryId: 'sauce', itemId: 'sojasas', portion: 'normal' },
    ],
    totalNutrition: { kcal: 475, protein: 40, carbs: 48, fat: 14 },
    tags: ['asiatiskt', 'snabb', 'hälsosam'],
  },
  {
    id: 'pizza_hemlagad',
    name: 'Pizza (hemlagad)',
    description: 'Vesuvio/Hawaii/Kebab etc',
    components: [
      { categoryId: 'carb', itemId: 'brod_ljust', portion: 'large' },
      { categoryId: 'protein', itemId: 'kassler', portion: 'normal' },
      { categoryId: 'sauce', itemId: 'tomatsas', portion: 'normal' },
      { categoryId: 'fat', itemId: 'ost_hard', portion: 'large' },
    ],
    totalNutrition: { kcal: 607, protein: 35, carbs: 50, fat: 30 },
    tags: ['pizza', 'fredag', 'barnfavorit'],
  },
  {
    id: 'hamburgare',
    name: 'Hamburgare',
    description: 'Med pommes och tillbehör',
    components: [
      { categoryId: 'protein', itemId: 'pannbiff', portion: 'normal' },
      { categoryId: 'carb', itemId: 'brod_ljust', portion: 'normal' },
      { categoryId: 'carb', itemId: 'pommes', portion: 'normal' },
      { categoryId: 'fat', itemId: 'ost_hard', portion: 'small' },
      { categoryId: 'sauce', itemId: 'ketchup', portion: 'normal' },
    ],
    totalNutrition: { kcal: 847, protein: 36, carbs: 78, fat: 44 },
    tags: ['modern', 'snabbmat', 'barnfavorit'],
  },
  {
    id: 'pasta_carbonara',
    name: 'Pasta Carbonara',
    description: 'Med bacon och parmesan',
    components: [
      { categoryId: 'carb', itemId: 'spagetti', portion: 'large' },
      { categoryId: 'protein', itemId: 'bacon', portion: 'normal' },
      { categoryId: 'fat', itemId: 'ost_hard', portion: 'normal' },
      { categoryId: 'fat', itemId: 'gradde', portion: 'small' },
    ],
    totalNutrition: { kcal: 691, protein: 34, carbs: 53, fat: 39 },
    tags: ['pasta', 'italienskt', 'snabb'],
  },
  {
    id: 'pasta_pesto',
    name: 'Pasta med pesto',
    description: 'Enkel pasta med pestosås',
    components: [
      { categoryId: 'carb', itemId: 'pasta_kokt', portion: 'large' },
      { categoryId: 'sauce', itemId: 'pesto', portion: 'normal' },
      { categoryId: 'fat', itemId: 'ost_hard', portion: 'normal' },
      { categoryId: 'vegetable', itemId: 'tomat', portion: 'normal' },
    ],
    totalNutrition: { kcal: 540, protein: 21, carbs: 53, fat: 28 },
    tags: ['pasta', 'vegetariskt', 'snabb'],
  },
  {
    id: 'soppa_brod',
    name: 'Soppa med bröd',
    description: 'Tomatsoppa/grönsakssoppa',
    components: [
      { categoryId: 'vegetable', itemId: 'tomat', portion: 'large' },
      { categoryId: 'vegetable', itemId: 'morotter', portion: 'normal' },
      { categoryId: 'carb', itemId: 'brod_morkt', portion: 'normal' },
      { categoryId: 'fat', itemId: 'smor', portion: 'normal' },
    ],
    totalNutrition: { kcal: 271, protein: 7, carbs: 31, fat: 13 },
    tags: ['soppa', 'lunch', 'vegetariskt'],
  },
  {
    id: 'kycklingcurry',
    name: 'Kycklingcurry',
    description: 'Med ris och naan',
    components: [
      { categoryId: 'protein', itemId: 'kycklingfile', portion: 'normal' },
      { categoryId: 'carb', itemId: 'ris_kokt', portion: 'normal' },
      { categoryId: 'fat', itemId: 'creme_fraiche', portion: 'normal' },
      { categoryId: 'vegetable', itemId: 'paprika', portion: 'normal' },
    ],
    totalNutrition: { kcal: 551, protein: 41, carbs: 50, fat: 21 },
    tags: ['indiskt', 'curry', 'modern'],
  },
  {
    id: 'enchiladas',
    name: 'Enchiladas',
    description: 'Med kyckling och ost',
    components: [
      { categoryId: 'protein', itemId: 'kycklingfile', portion: 'normal' },
      { categoryId: 'carb', itemId: 'brod_ljust', portion: 'normal' },
      { categoryId: 'sauce', itemId: 'tomatsas', portion: 'normal' },
      { categoryId: 'fat', itemId: 'ost_hard', portion: 'normal' },
      { categoryId: 'fat', itemId: 'creme_fraiche', portion: 'normal' },
    ],
    totalNutrition: { kcal: 660, protein: 47, carbs: 34, fat: 38 },
    tags: ['mexikanskt', 'modern'],
  },
  {
    id: 'kycklingnuggets',
    name: 'Kycklingnuggets med pommes',
    description: 'Barnfavorit med dipp',
    components: [
      { categoryId: 'protein', itemId: 'kycklingfile', portion: 'normal' },
      { categoryId: 'carb', itemId: 'pommes', portion: 'normal' },
      { categoryId: 'sauce', itemId: 'ketchup', portion: 'normal' },
      { categoryId: 'sauce', itemId: 'sweet_chili', portion: 'small' },
    ],
    totalNutrition: { kcal: 585, protein: 38, carbs: 63, fat: 21 },
    tags: ['barnfavorit', 'snabbmat', 'fredag'],
  },

  // ==========================================
  // KYCKLING & FÅGEL
  // ==========================================
  {
    id: 'kycklingklubba_ris',
    name: 'Kycklingklubbor med ris',
    description: 'Ugnsstekta klubbor med ris',
    components: [
      { categoryId: 'protein', itemId: 'kycklingklubba', portion: 'large' },
      { categoryId: 'carb', itemId: 'ris_kokt', portion: 'normal' },
      { categoryId: 'vegetable', itemId: 'sallad_blandad', portion: 'normal' },
      { categoryId: 'sauce', itemId: 'aioli', portion: 'normal' },
    ],
    totalNutrition: { kcal: 737, protein: 40, carbs: 48, fat: 44 },
    tags: ['kyckling', 'vardagsmat'],
  },
  {
    id: 'kyckling_grillad',
    name: 'Grillad kyckling',
    description: 'Med klyftpotatis och tzatziki',
    components: [
      { categoryId: 'protein', itemId: 'kycklingfile', portion: 'large' },
      { categoryId: 'carb', itemId: 'klyftpotatis', portion: 'normal' },
      { categoryId: 'sauce', itemId: 'tzatziki', portion: 'normal' },
      { categoryId: 'vegetable', itemId: 'sallad_blandad', portion: 'normal' },
    ],
    totalNutrition: { kcal: 478, protein: 52, carbs: 33, fat: 14 },
    tags: ['kyckling', 'grillfest', 'sommar'],
  },
  {
    id: 'kalkon_middag',
    name: 'Kalkonfilé med mos',
    description: 'Mager kalkon med potatismos',
    components: [
      { categoryId: 'protein', itemId: 'kalkon', portion: 'normal' },
      { categoryId: 'carb', itemId: 'potatismos', portion: 'normal' },
      { categoryId: 'sauce', itemId: 'brunsas', portion: 'normal' },
      { categoryId: 'vegetable', itemId: 'haricots_verts', portion: 'normal' },
    ],
    totalNutrition: { kcal: 369, protein: 44, carbs: 30, fat: 7 },
    tags: ['fågel', 'hälsosam', 'mager'],
  },

  // ==========================================
  // NÖTKÖTT
  // ==========================================
  {
    id: 'biff_bearnaise',
    name: 'Biff med bearnaise',
    description: 'Klassisk biff med pommes',
    components: [
      { categoryId: 'protein', itemId: 'biff', portion: 'normal' },
      { categoryId: 'carb', itemId: 'pommes', portion: 'normal' },
      { categoryId: 'sauce', itemId: 'bearnaise', portion: 'normal' },
      { categoryId: 'vegetable', itemId: 'sallad_blandad', portion: 'normal' },
    ],
    totalNutrition: { kcal: 968, protein: 46, carbs: 47, fat: 67 },
    tags: ['festmat', 'biff', 'restaurang'],
  },
  {
    id: 'biff_rydberg',
    name: 'Biff Rydberg',
    description: 'Klassisk rätt med tärnad biff',
    components: [
      { categoryId: 'protein', itemId: 'biff', portion: 'normal' },
      { categoryId: 'carb', itemId: 'stekt_potatis', portion: 'normal' },
      { categoryId: 'vegetable', itemId: 'lok_stekt', portion: 'normal' },
      { categoryId: 'protein', itemId: 'agg_stekt', portion: 'normal' },
    ],
    totalNutrition: { kcal: 743, protein: 55, carbs: 36, fat: 43 },
    tags: ['husmanskost', 'klassiker', 'festmat'],
  },
  {
    id: 'oxfile_roda_vinglas',
    name: 'Oxfilé med rödvinssås',
    description: 'Lyxig middag med gratäng',
    components: [
      { categoryId: 'protein', itemId: 'biff', portion: 'large' },
      { categoryId: 'carb', itemId: 'gratang_potatis', portion: 'normal' },
      { categoryId: 'sauce', itemId: 'brunsas', portion: 'large' },
      { categoryId: 'vegetable', itemId: 'haricots_verts', portion: 'normal' },
    ],
    totalNutrition: { kcal: 742, protein: 56, carbs: 38, fat: 40 },
    tags: ['festmat', 'lyxigt', 'helg'],
  },

  // ==========================================
  // FLÄSK
  // ==========================================
  {
    id: 'flaskfile_sas',
    name: 'Fläskfilé med gräddsås',
    description: 'Mör filé med mos och sås',
    components: [
      { categoryId: 'protein', itemId: 'flaskfile', portion: 'normal' },
      { categoryId: 'carb', itemId: 'potatismos', portion: 'normal' },
      { categoryId: 'sauce', itemId: 'graddsas', portion: 'normal' },
      { categoryId: 'vegetable', itemId: 'broccoli', portion: 'normal' },
    ],
    totalNutrition: { kcal: 500, protein: 46, carbs: 28, fat: 24 },
    tags: ['fläsk', 'vardagsmat', 'mör'],
  },
  {
    id: 'kassler_stuvad',
    name: 'Kassler med stuvning',
    description: 'Kassler med stuvade grönsaker',
    components: [
      { categoryId: 'protein', itemId: 'kassler', portion: 'normal' },
      { categoryId: 'carb', itemId: 'potatis_kokt', portion: 'normal' },
      { categoryId: 'sauce', itemId: 'vitsas', portion: 'normal' },
      { categoryId: 'vegetable', itemId: 'blomkal', portion: 'normal' },
    ],
    totalNutrition: { kcal: 443, protein: 31, carbs: 34, fat: 21 },
    tags: ['fläsk', 'husmanskost'],
  },
  {
    id: 'flaskkarré_apel',
    name: 'Fläskkotlett med äppelmos',
    description: 'Stekt kotlett med klassiska tillbehör',
    components: [
      { categoryId: 'protein', itemId: 'flaskkarré', portion: 'normal' },
      { categoryId: 'carb', itemId: 'potatis_kokt', portion: 'normal' },
      { categoryId: 'sauce', itemId: 'brunsas', portion: 'normal' },
      { categoryId: 'vegetable', itemId: 'haricots_verts', portion: 'normal' },
    ],
    totalNutrition: { kcal: 463, protein: 40, carbs: 35, fat: 18 },
    tags: ['fläsk', 'husmanskost', 'klassiker'],
  },

  // ==========================================
  // VEGETARISKT
  // ==========================================
  {
    id: 'quorn_pasta',
    name: 'Quorn-pasta',
    description: 'Vegetarisk köttfärssås',
    components: [
      { categoryId: 'protein', itemId: 'quorn', portion: 'normal' },
      { categoryId: 'carb', itemId: 'pasta_kokt', portion: 'normal' },
      { categoryId: 'sauce', itemId: 'tomatsas', portion: 'normal' },
      { categoryId: 'fat', itemId: 'ost_hard', portion: 'small' },
    ],
    totalNutrition: { kcal: 422, protein: 30, carbs: 50, fat: 12 },
    tags: ['vegetariskt', 'pasta', 'hälsosam'],
  },
  {
    id: 'linssoppa',
    name: 'Linssoppa',
    description: 'Mättande linssoppa med bröd',
    components: [
      { categoryId: 'protein', itemId: 'linser', portion: 'normal' },
      { categoryId: 'vegetable', itemId: 'morotter', portion: 'normal' },
      { categoryId: 'carb', itemId: 'brod_morkt', portion: 'normal' },
      { categoryId: 'fat', itemId: 'smor', portion: 'normal' },
    ],
    totalNutrition: { kcal: 358, protein: 19, carbs: 50, fat: 10 },
    tags: ['vegetariskt', 'soppa', 'hälsosam'],
  },
  {
    id: 'bongryta',
    name: 'Böngryta',
    description: 'Vegetarisk gryta med ris',
    components: [
      { categoryId: 'protein', itemId: 'bonor', portion: 'normal' },
      { categoryId: 'carb', itemId: 'ris_kokt', portion: 'normal' },
      { categoryId: 'vegetable', itemId: 'paprika', portion: 'normal' },
      { categoryId: 'sauce', itemId: 'tomatsas', portion: 'normal' },
    ],
    totalNutrition: { kcal: 411, protein: 17, carbs: 70, fat: 6 },
    tags: ['vegetariskt', 'gryta', 'vegansk'],
  },
  {
    id: 'tofu_wok',
    name: 'Tofuwok',
    description: 'Wokad tofu med grönsaker',
    components: [
      { categoryId: 'protein', itemId: 'tofu', portion: 'normal' },
      { categoryId: 'carb', itemId: 'ris_kokt', portion: 'normal' },
      { categoryId: 'vegetable', itemId: 'wokgront', portion: 'normal' },
      { categoryId: 'sauce', itemId: 'sojasas', portion: 'normal' },
      { categoryId: 'fat', itemId: 'matolja', portion: 'normal' },
    ],
    totalNutrition: { kcal: 500, protein: 20, carbs: 53, fat: 24 },
    tags: ['vegetariskt', 'asiatiskt', 'vegansk'],
  },
  {
    id: 'agg_omelett',
    name: 'Omelett med fyllning',
    description: 'Omelett med ost och grönsaker',
    components: [
      { categoryId: 'protein', itemId: 'aggrora', portion: 'large' },
      { categoryId: 'fat', itemId: 'ost_hard', portion: 'normal' },
      { categoryId: 'vegetable', itemId: 'tomat', portion: 'normal' },
      { categoryId: 'carb', itemId: 'brod_morkt', portion: 'normal' },
    ],
    totalNutrition: { kcal: 508, protein: 28, carbs: 25, fat: 34 },
    tags: ['ägg', 'brunch', 'snabb'],
  },
  {
    id: 'halloumi_sallad',
    name: 'Halloumisallad',
    description: 'Stekt halloumi med sallad',
    components: [
      { categoryId: 'fat', itemId: 'ost_hard', portion: 'large' },
      { categoryId: 'vegetable', itemId: 'sallad_blandad', portion: 'large' },
      { categoryId: 'vegetable', itemId: 'tomat', portion: 'normal' },
      { categoryId: 'vegetable', itemId: 'gurka', portion: 'normal' },
      { categoryId: 'fat', itemId: 'olivolja', portion: 'normal' },
    ],
    totalNutrition: { kcal: 373, protein: 17, carbs: 11, fat: 31 },
    tags: ['vegetariskt', 'sallad', 'sommar'],
  },

  // ==========================================
  // SNABBA MIDDAGAR
  // ==========================================
  {
    id: 'aggrora_brod',
    name: 'Äggröra med bröd',
    description: 'Snabb middag med ägg',
    components: [
      { categoryId: 'protein', itemId: 'aggrora', portion: 'normal' },
      { categoryId: 'carb', itemId: 'brod_morkt', portion: 'normal' },
      { categoryId: 'fat', itemId: 'smor', portion: 'normal' },
      { categoryId: 'vegetable', itemId: 'tomat', portion: 'normal' },
    ],
    totalNutrition: { kcal: 378, protein: 18, carbs: 24, fat: 24 },
    tags: ['snabb', 'ägg', 'lunch'],
  },
  {
    id: 'tonfisksallad',
    name: 'Tonfisksallad',
    description: 'Sallad med tonfisk',
    components: [
      { categoryId: 'protein', itemId: 'rakor', portion: 'normal' },
      { categoryId: 'vegetable', itemId: 'sallad_blandad', portion: 'large' },
      { categoryId: 'vegetable', itemId: 'tomat', portion: 'normal' },
      { categoryId: 'fat', itemId: 'olivolja', portion: 'normal' },
      { categoryId: 'carb', itemId: 'brod_morkt', portion: 'normal' },
    ],
    totalNutrition: { kcal: 338, protein: 28, carbs: 26, fat: 15 },
    tags: ['snabb', 'sallad', 'hälsosam'],
  },
  {
    id: 'toast_skinka_ost',
    name: 'Toast skinka ost',
    description: 'Klassisk toast',
    components: [
      { categoryId: 'carb', itemId: 'brod_ljust', portion: 'normal' },
      { categoryId: 'protein', itemId: 'kassler', portion: 'small' },
      { categoryId: 'fat', itemId: 'ost_hard', portion: 'normal' },
      { categoryId: 'fat', itemId: 'smor', portion: 'normal' },
    ],
    totalNutrition: { kcal: 420, protein: 24, carbs: 21, fat: 27 },
    tags: ['snabb', 'lunch', 'barnfavorit'],
  },
  {
    id: 'makaronilada',
    name: 'Makaronilåda',
    description: 'Enkel gratäng med falukorv',
    components: [
      { categoryId: 'protein', itemId: 'falukorv', portion: 'normal' },
      { categoryId: 'carb', itemId: 'makaroner', portion: 'normal' },
      { categoryId: 'sauce', itemId: 'tomatsas', portion: 'normal' },
      { categoryId: 'fat', itemId: 'ost_hard', portion: 'normal' },
    ],
    totalNutrition: { kcal: 595, protein: 30, carbs: 50, fat: 31 },
    tags: ['snabb', 'gratäng', 'barnfavorit'],
  },
  {
    id: 'nudelwok',
    name: 'Snabb nudelwok',
    description: 'Woknudlar med kyckling',
    components: [
      { categoryId: 'protein', itemId: 'kycklingfile', portion: 'normal' },
      { categoryId: 'carb', itemId: 'pasta_kokt', portion: 'normal' },
      { categoryId: 'vegetable', itemId: 'wokgront', portion: 'normal' },
      { categoryId: 'sauce', itemId: 'sojasas', portion: 'normal' },
    ],
    totalNutrition: { kcal: 422, protein: 42, carbs: 44, fat: 8 },
    tags: ['snabb', 'asiatiskt', 'vardagsmat'],
  },

  // ==========================================
  // HELGMIDDAGAR
  // ==========================================
  {
    id: 'sondagsstek',
    name: 'Söndagsstek',
    description: 'Klassisk helgstek med tillbehör',
    components: [
      { categoryId: 'protein', itemId: 'biff', portion: 'large' },
      { categoryId: 'carb', itemId: 'gratang_potatis', portion: 'normal' },
      { categoryId: 'sauce', itemId: 'brunsas', portion: 'large' },
      { categoryId: 'vegetable', itemId: 'haricots_verts', portion: 'normal' },
      { categoryId: 'sauce', itemId: 'lingonsylt', portion: 'normal' },
    ],
    totalNutrition: { kcal: 802, protein: 59, carbs: 54, fat: 40 },
    tags: ['helg', 'söndag', 'festmat'],
  },
  {
    id: 'grillmiddag',
    name: 'Grillmiddag',
    description: 'Grillad kyckling och korv',
    components: [
      { categoryId: 'protein', itemId: 'kycklingklubba', portion: 'normal' },
      { categoryId: 'protein', itemId: 'falukorv', portion: 'small' },
      { categoryId: 'carb', itemId: 'potatis_kokt', portion: 'normal' },
      { categoryId: 'vegetable', itemId: 'sallad_blandad', portion: 'normal' },
      { categoryId: 'sauce', itemId: 'tzatziki', portion: 'normal' },
    ],
    totalNutrition: { kcal: 586, protein: 37, carbs: 36, fat: 34 },
    tags: ['grill', 'sommar', 'helg'],
  },
];

// Helper functions
export function getDinnerById(id: string): FamilyDinnerPreset | undefined {
  return FAMILY_DINNER_PRESETS.find((preset) => preset.id === id);
}

export function getDinnersByTag(tag: string): FamilyDinnerPreset[] {
  return FAMILY_DINNER_PRESETS.filter((preset) => preset.tags?.includes(tag));
}

export function searchDinners(query: string): FamilyDinnerPreset[] {
  const lowerQuery = query.toLowerCase();
  return FAMILY_DINNER_PRESETS.filter(
    (preset) =>
      preset.name.toLowerCase().includes(lowerQuery) ||
      preset.description.toLowerCase().includes(lowerQuery) ||
      preset.tags?.some((tag) => tag.includes(lowerQuery))
  );
}

// Get all unique tags
export function getAllTags(): string[] {
  const tags = new Set<string>();
  FAMILY_DINNER_PRESETS.forEach((preset) => {
    preset.tags?.forEach((tag) => tags.add(tag));
  });
  return Array.from(tags).sort();
}

// Get dinners grouped by category
export function getDinnersGrouped(): Record<string, FamilyDinnerPreset[]> {
  return {
    husmanskost: getDinnersByTag('husmanskost'),
    fisk: getDinnersByTag('fisk'),
    kyckling: getDinnersByTag('kyckling'),
    pasta: getDinnersByTag('pasta'),
    vegetariskt: getDinnersByTag('vegetariskt'),
    snabb: getDinnersByTag('snabb'),
    barnfavorit: getDinnersByTag('barnfavorit'),
    festmat: getDinnersByTag('festmat'),
  };
}
