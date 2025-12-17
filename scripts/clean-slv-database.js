const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'public', 'data', 'slv-foods.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// Kategorier som är sammansatta rätter - ska tas bort
const EXCLUDE_CATEGORIES = [
  'Blodmat',
  'Blodprodukter blodrätter',
  'Bullar kakor tårtor mm',
  'Barnmatsprodukter exkl. välling o gröt',
  'Efterrätter',
  'Fisk o skaldjursprodukter o rätter',
  'Fågelprodukter fågelrätter',
  'Glass',
  'Godis choklad tuggummi',
  'Godis ej choklad',
  'Godis som innehåller choklad',
  'Grynrätter',
  'Grönsaks- rotfrukts- baljväxträtter o produkter',
  'Gröt',
  'Hamburgare med  bröd (kött, fisk, fågel, vegetarisk)',
  'Inälvor organ produkter o rätter',
  'Korvrätter',
  'Köttprodukter kötträtter',
  'Majonnässallad röror',
  'Osträtter',
  'Pannkakor, våfflor, crêpes',
  'Pastarätter',
  'Pizza paj pirog färdig smörgås',
  'Potatisprodukter potatisrätter',
  'Risrätter',
  'Sallad blandad mat',
  'Soppa mat',
  'Sås dressing majonnäs ',
  'Söta soppor kräm o efterrättssås',
  'Sylt marmelad gelé äppelmos o dyl',
  'Äggprodukter o rätter',
  'Övriga ospecificerade blandade rätter',
  'Vegetabiliskt protein produkter och rätter',
  'Välling',
  'Cider alkoläsk drink',
  'Likör',
  'Starksprit',
  'Vin',
  'Öl',
  'Dryck',
  'Lightdrycker u energi',
  'Saft läsk cider u alkohol ',
  'Sportdrycker energidrycker',
  'Övriga sötade drycker vattenchoklad',
  'Mjölkdryck chokladdryck milkshake smothie m yoghurt',
  'Kaffe',
  'Te',
  'Vatten mineralvatten',
  'Buljong',
  'Chips popcorn o dyl',
  'Kakaoprodukter',
  'Kost- o näringspreparat',
  'Senap ketchup HP-sås soja "smaksättare"',
  'Tuggummi',
  'Sockerfritt godis',
  'Sötningsmedel',
  'Tacoskal',
  'Ättika vinäger',
  'Gelatin agar agar',
  'Jäst bakpulver',
  'Salt',
  'Kryddor ',
];

// Skapa ny rensat objekt
const cleanedData = {
  source: data.source,
  lastUpdated: new Date().toISOString(),
  description: 'Rensad SLV-databas med endast råvaror (inga sammansatta rätter)',
  categories: {}
};

// Behåll bara råvarukategorier
for (const [cat, foods] of Object.entries(data.categories)) {
  if (!EXCLUDE_CATEGORIES.includes(cat)) {
    cleanedData.categories[cat] = foods;
  }
}

// Spara till samma fil (ersätt)
fs.writeFileSync(dataPath, JSON.stringify(cleanedData, null, 2));

let total = 0;
for (const foods of Object.values(cleanedData.categories)) {
  total += foods.length;
}

console.log(`Rensade SLV-databasen: ${total} råvaror behålls`);
console.log('Tog bort ' + EXCLUDE_CATEGORIES.length + ' kategorier med sammansatta rätter');
