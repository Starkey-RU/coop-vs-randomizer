const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.json');
const SVGS_DIR = path.join(__dirname, 'public/assets/stratagems');

function run() {
  const dbData = fs.readFileSync(DB_PATH, 'utf-8');
  const db = JSON.parse(dbData);
  const svgs = fs.readdirSync(SVGS_DIR);

  console.log(`Found ${svgs.length} svgs`);
  
  let missing = 0;
  // Структура database.json: db.stratagems - массив категорий, или может stratagems это ключ на уровне корня
  // проверим где стратагемы
  const stratagemList = db.stratagems || (db.categories ? db.categories.find(c => c.name === 'Stratagems').items : []);
  
  for (const stratagem of stratagemList) {
    if (!stratagem.imageURL) {
        console.log(`Missing imageURL field for ${stratagem.name}`);
        continue;
    }
    
    const fileName = path.basename(stratagem.imageURL);
    const filePath = path.join(SVGS_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      console.log(`[MISSING] ${stratagem.name}: ${fileName}`);
      missing++;
      
      const nameMatches = svgs.filter(s => s.toLowerCase().includes(stratagem.name.toLowerCase()));
      if (nameMatches.length > 0) {
          console.log(`  Suggested for ${stratagem.name}: ${nameMatches.join(', ')}`);
      } else {
           let cleanName = stratagem.name.replace(/Orbital |Eagle | Strike| Barrage/ig, '').trim();
           const fuzzyMatches = svgs.filter(s => s.toLowerCase().includes(cleanName.toLowerCase()));
           if (fuzzyMatches.length > 0) {
               console.log(`  Fuzzy suggested for ${stratagem.name}: ${fuzzyMatches.join(', ')}`);
           }
      }
    }
  }
  
  console.log(`Total missing: ${missing}`);
}

run();
