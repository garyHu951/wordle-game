const fs = require('fs');
const path = require('path');

// 讀取不雅詞彙過濾器
const profanityFilter = JSON.parse(fs.readFileSync(path.join(__dirname, 'profanity-filter.json'), 'utf8'));

// 單字文件列表
const wordFiles = [
  '4-letter-words.json',
  '5-letter-words.json', 
  '6-letter-words.json',
  '7-letter-words.json'
];

// 過濾函數
function containsProfanity(word) {
  const normalizedWord = word.toLowerCase();
  return profanityFilter.profanityWords.some(profaneWord => 
    normalizedWord.includes(profaneWord.toLowerCase())
  );
}

// 處理每個單字文件
wordFiles.forEach(filename => {
  const filePath = path.join(__dirname, filename);
  
  try {
    // 讀取原始單字列表
    const originalWords = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`Processing ${filename}: ${originalWords.length} words`);
    
    // 過濾不雅詞彙
    const filteredWords = originalWords.filter(word => !containsProfanity(word));
    const removedCount = originalWords.length - filteredWords.length;
    
    console.log(`Removed ${removedCount} inappropriate words from ${filename}`);
    console.log(`Remaining: ${filteredWords.length} words`);
    
    // 創建備份
    const backupPath = filePath.replace('.json', '.backup.json');
    fs.writeFileSync(backupPath, JSON.stringify(originalWords, null, 2));
    console.log(`Backup created: ${backupPath}`);
    
    // 寫入過濾後的單字列表
    fs.writeFileSync(filePath, JSON.stringify(filteredWords, null, 2));
    console.log(`Updated ${filename}\n`);
    
  } catch (error) {
    console.error(`Error processing ${filename}:`, error);
  }
});

// 添加特殊詞彙 "rickrol" 到 7 字母單字列表
const sevenLetterPath = path.join(__dirname, '7-letter-words.json');
try {
  const sevenLetterWords = JSON.parse(fs.readFileSync(sevenLetterPath, 'utf8'));
  
  if (!sevenLetterWords.includes('rickrol')) {
    sevenLetterWords.push('rickrol');
    sevenLetterWords.sort(); // 保持排序
    fs.writeFileSync(sevenLetterPath, JSON.stringify(sevenLetterWords, null, 2));
    console.log('Added "rickrol" to 7-letter-words.json');
  } else {
    console.log('"rickrol" already exists in 7-letter-words.json');
  }
} catch (error) {
  console.error('Error adding rickrol:', error);
}

console.log('Word filtering completed!');