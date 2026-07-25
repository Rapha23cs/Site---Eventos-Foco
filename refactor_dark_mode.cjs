const fs = require('fs');
const path = require('path');

const replacements = [
  { regex: /(?<!dark:)bg-white/g, replace: 'bg-white dark:bg-slate-900' },
  { regex: /(?<!dark:)bg-\[\#F8FAFC\]/g, replace: 'bg-[#F8FAFC] dark:bg-slate-950' },
  { regex: /(?<!dark:)bg-\[\#F9FAFB\]/g, replace: 'bg-[#F9FAFB] dark:bg-slate-950' },
  { regex: /(?<!dark:)bg-gray-50/g, replace: 'bg-gray-50 dark:bg-slate-800/50' },
  { regex: /(?<!dark:)text-gray-900/g, replace: 'text-gray-900 dark:text-white' },
  { regex: /(?<!dark:)text-\[\#1A1A1A\]/g, replace: 'text-[#1A1A1A] dark:text-white' },
  { regex: /(?<!dark:)text-gray-800/g, replace: 'text-gray-800 dark:text-slate-200' },
  { regex: /(?<!dark:)text-gray-700/g, replace: 'text-gray-700 dark:text-slate-300' },
  { regex: /(?<!dark:)text-gray-600/g, replace: 'text-gray-600 dark:text-slate-400' },
  { regex: /(?<!dark:)text-gray-500/g, replace: 'text-gray-500 dark:text-slate-400' },
  { regex: /(?<!dark:)border-gray-100/g, replace: 'border-gray-100 dark:border-slate-800' },
  { regex: /(?<!dark:)border-gray-200/g, replace: 'border-gray-200 dark:border-slate-700' },
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
