const fs = require('fs');
const filePath = './src/data/mockData.ts';
let rawText = fs.readFileSync(filePath, 'utf8');
rawText = rawText.replace('export default ', '');
const data = JSON.parse(rawText);

function findArticleById(obj, targetId) {
  const resultList = [];
  function deepLoop(item) {
    if (item && item.id === targetId) {
      resultList.push(item);
    }
    if (Array.isArray(item)) {
      item.forEach(deepLoop);
    } else if (typeof item === 'object' && item !== null) {
      Object.values(item).forEach(deepLoop);
    }
  }
  deepLoop(obj);
  return resultList;
}

const targetArticle = findArticleById(data, 'teenager-1');
console.log("===== teenager-1 检索结果 ====", targetArticle);