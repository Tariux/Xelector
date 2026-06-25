const fs = require('fs');
const path = require('path');

function sanitizeExtensionId(extensionId) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(extensionId || '')) {
    throw new Error('Invalid extension id');
  }

  return extensionId;
}

module.exports = function createDatabaseManager(deps) {
  const storage = deps.storage;

  return {
    initCore: function () {
      storage.ensureDirectory(storage.coreDir);
      storage.writeJson('schema.json', {
        version: 1,
        storage: 'json-bootstrap',
        updatedAt: Date.now()
      });
      return { ok: true };
    },
    migrateCore: function () {
      return { ok: true, version: 1 };
    },
    provisionExtensionDatabase: function (manifest) {
      const extensionId = sanitizeExtensionId(manifest.id);
      const dir = path.join(storage.extensionsDir, 'data', extensionId);
      storage.ensureDirectory(dir);
      const dbPath = path.join(dir, extensionId + '.json');

      if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ extensionId: extensionId, records: [] }, null, 2));
      }

      return { extensionId: extensionId, path: dbPath };
    },
    getExtensionDatabase: function (extensionId) {
      const safeId = sanitizeExtensionId(extensionId);
      return path.join(storage.extensionsDir, 'data', safeId, safeId + '.json');
    },
    wipeExtensionData: function (extensionId) {
      const safeId = sanitizeExtensionId(extensionId);
      const dir = path.join(storage.extensionsDir, 'data', safeId);

      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }

      return { ok: true, extensionId: safeId };
    },
    transaction: function (fn) {
      return fn();
    }
  };
};
