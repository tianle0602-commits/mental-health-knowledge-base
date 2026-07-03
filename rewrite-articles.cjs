const fs = require('fs');
const path = require('path');
const targetFile = path.join(__dirname, 'src/data/mockData.ts');
const backupFile = targetFile + '.bak';

fs.copyFileSync(targetFile, backupFile);
console.log('✅ 原始文件已备份至', backupFile);

let content = fs.readFileSync(targetFile, 'utf8');
// 只剥离 export default，前面的import type保留在ts文件里，脚本不处理
const jsonStr = content.replace(/export default\s*/, '');
const data = JSON.parse(jsonStr);

// 替换规则在这里修改
const replaceRules = [
  { field: "title", reg: /旧标题/g, newText: "优化后的心理学标题" },
  { field: "summary", reg: /旧摘要/g, newText: "扩充心理学家理论摘要" },
  { field: "content", reg: /旧正文/g, newText: "补充心理学家经典理论与著作" }
];

data.articles = data.articles.map(item => {
  let newItem = {...item};
  replaceRules.forEach(rule => {
    if (newItem[rule.field]) {
      newItem[rule.field] = newItem[rule.field].replace(rule.reg, rule.newText);
    }
  })
  return newItem;
});

// 写回文件，还原ts头部导入+导出
const tsHeader = `import type { Article, CategoryInfo, StatItem } from '../types/index';\n`;
const output = tsHeader + `export default ${JSON.stringify(data, null, 2)}`;
fs.writeFileSync(targetFile, output, 'utf8');
console.log("✅ Done! All replacements applied.");