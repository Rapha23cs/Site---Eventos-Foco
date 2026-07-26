const fs = require('fs');
const path = require('path');

const replacements = [
  { regex: /(?<!dark:)text-\[\#303392\]/g, replace: 'text-[#303392] dark:text-blue-400' },
  { regex: /(?<!dark:)text-\[\#1E205A\]/g, replace: 'text-[#1E205A] dark:text-blue-300' },
  { regex: /(?<!dark:)bg-\[\#303392\]\/5(?!0)/g, replace: 'bg-[#303392]/5 dark:bg-blue-900/20' },
  { regex: /(?<!dark:)bg-\[\#303392\]\/10/g, replace: 'bg-[#303392]/10 dark:bg-blue-900/30' },
  { regex: /(?<!dark:)border-\[\#303392\]/g, replace: 'border-[#303392] dark:border-blue-500' },
  { regex: /(?<!dark:)hover:bg-gray-100/g, replace: 'hover:bg-gray-100 dark:hover:bg-slate-800' },
  { regex: /(?<!dark:)hover:bg-gray-50/g, replace: 'hover:bg-gray-50 dark:hover:bg-slate-800/50' },
  { regex: /(?<!dark:)bg-slate-50/g, replace: 'bg-slate-50 dark:bg-slate-800/50' },
  { regex: /(?<!dark:)border-slate-200/g, replace: 'border-slate-200 dark:border-slate-700' },
];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));

files.forEach(file => {
  // Skip Login.tsx to avoid messing up the fixes we just did manually
  if (file.includes('Login.tsx')) return;
  
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  replacements.forEach(({ regex, replace }) => {
    content = content.replace(regex, replace);
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Refactored: ${file}`);
  }
});

console.log('Refactoring complete.');
