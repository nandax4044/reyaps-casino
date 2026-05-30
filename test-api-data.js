// Quick test to verify API data is complete
import fs from 'fs';

console.log('🔍 Verifying API data completeness...\n');

// Read the API file
const apiContent = fs.readFileSync('./api/index.ts', 'utf8');

// Count chests
const chestMatches = apiContent.match(/"id":\s*"[^"]+",\s*"name":\s*"[^"]+\s*Chest"/g);
const chestCount = chestMatches ? chestMatches.length : 0;

// Check for specific chests
const expectedChests = [
  'Fishing Chest',
  'Farm Chest',
  'Citem Chest',
  'Magic Chest',
  'Animal Chest',
  'Treasure Chest',
  'Space Chest',
  'Ocean Chest',
  'Dragon Chest',
  'Tech Chest',
  'Candy Chest',
  'Sports Chest',
  'Music Chest',
  'Ancient Chest',
  'Crystal Chest'
];

console.log('📦 CHEST DATA:');
console.log(`   Total chests found: ${chestCount}/15`);

let allFound = true;
expectedChests.forEach((chest, index) => {
  const found = apiContent.includes(`"name": "${chest}"`);
  const status = found ? '✅' : '❌';
  console.log(`   ${status} ${index + 1}. ${chest}`);
  if (!found) allFound = false;
});

// Check wheel prizes
const wheelPrizes = apiContent.match(/"name":\s*"[^"]+\s*🏎️"/g) || 
                    apiContent.match(/"name":\s*"Luxury Hypercar/g);
const hasWheelData = apiContent.includes('rodaDefault') && apiContent.includes('prizes');

console.log('\n🎡 WHEEL DATA:');
console.log(`   ${hasWheelData ? '✅' : '❌'} Wheel prizes data found`);

// Check crash game
const hasCrashData = apiContent.includes('permainanDefault') && 
                     apiContent.includes('crashSettings');

console.log('\n🚀 CRASH GAME DATA:');
console.log(`   ${hasCrashData ? '✅' : '❌'} Crash game settings found`);

// Final verdict
console.log('\n' + '='.repeat(50));
if (allFound && hasWheelData && hasCrashData && chestCount === 15) {
  console.log('✅ ALL DATA COMPLETE - READY TO DEPLOY!');
  console.log('='.repeat(50));
  console.log('\n📝 Next steps:');
  console.log('   1. git add .');
  console.log('   2. git commit -m "Fix: Embed all 15 chests for Vercel"');
  console.log('   3. git push origin main');
  console.log('   4. Wait for Vercel auto-deploy');
  process.exit(0);
} else {
  console.log('❌ INCOMPLETE DATA - NEEDS FIX!');
  console.log('='.repeat(50));
  process.exit(1);
}
