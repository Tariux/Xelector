const fs = require('fs');
const path = require('path');

function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

module.exports = function createStorageAdapter(deps) {
  const userData = deps.app.getPath('userData');
  const coreDir = path.join(userData, 'core');
  const extensionsDir = path.join(userData, 'extensions');
  ensureDirectory(coreDir);
  ensureDirectory(extensionsDir);

  function readJson(fileName, fallback) {
    const filePath = path.join(coreDir, fileName);

    if (!fs.existsSync(filePath)) {
      return fallback;
    }

    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  function writeJson(fileName, value) {
    const filePath = path.join(coreDir, fileName);
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
  }

  return {
    coreDir: coreDir,
    extensionsDir: extensionsDir,
    ensureDirectory: ensureDirectory,
    readJson: readJson,
    writeJson: writeJson
  };
};
