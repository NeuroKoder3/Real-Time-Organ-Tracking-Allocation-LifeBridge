const fs = require('fs');
const path = require('path');

const TARGET_DIRS = ['server', 'shared']; // Folders to search
const FILE_EXTENSION = '.ts';
const aliasPrefix = '@shared/';

// Matches imports like: from '@shared/schema'
const sharedImportRegex = new RegExp(`from\\s+['"](${aliasPrefix}[^'"]+)['"]`, 'g');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath, callback);
    } else if (file.endsWith(FILE_EXTENSION)) {
      callback(fullPath);
    }
  });
}

function fixSharedImportsInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  const updated = content.replace(sharedImportRegex, (match, importPath) => {
    if (importPath.endsWith('.js') || importPath.endsWith('.ts')) {
      return match; // Already correct
    }
    const newImportPath = `${importPath}.js`;
    return match.replace(importPath, newImportPath);
  });

  if (updated !== content) {
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`✅ Updated @shared imports in: ${filePath}`);
  }
}

// Run the script
TARGET_DIRS.forEach(dir => {
  const fullPath = path.resolve(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    walkDir(fullPath, fixSharedImportsInFile);
  }
});

console.log('🔁 Done: All @shared imports updated with `.js` extension.');
