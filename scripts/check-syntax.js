const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rootDir = path.resolve(__dirname, '..');
const sourceDir = path.join(rootDir, 'src');

function collectJavaScriptFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  entries.forEach(function (entry) {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push.apply(files, collectJavaScriptFiles(entryPath));
      return;
    }

    if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(entryPath);
    }
  });

  return files;
}

const files = collectJavaScriptFiles(sourceDir);

files.forEach(function (file) {
  const source = fs.readFileSync(file, 'utf8');
  new vm.Script(source, { filename: file });
});

console.log('Syntax check passed for ' + files.length + ' JavaScript files.');
