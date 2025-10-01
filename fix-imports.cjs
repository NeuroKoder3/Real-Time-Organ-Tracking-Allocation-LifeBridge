const fs = require('fs');
const path = require('path');

const TARGET_DIR = path.resolve(__dirname, 'server'); // Your TypeScript source folder
const FILE_EXTENSION = '.ts';

const importRegex = /from\s+['"](\.\/|\.\.\/)[^'"]+['"]/g;

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath, callback);
    } else {
      callback(fullPath);
    }
  });
}

function fixImportsInFile(filePath) {
  if (!filePath.endsWith(FILE_EXTENSION)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let updated = content.replace(importRegex, (match) => {
    const importPath = match.match(/['"](.*)['"]/)[1];

    if (/\.(js|ts|json)$/.test(importPath)) return match;

    const newImport = `${importPath}.js`;
    return match.replace(importPath, newImport);
  });

  if (updated !== content) {
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`✅ Fixed imports in: ${filePath}`);
  }
}

walkDir(TARGET_DIR, fixImportsInFile);
console.log('🔁 Done: Added `.js` to relative imports in .ts files.');
