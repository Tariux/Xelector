module.exports = function createExtensionManager(deps) {
  const extensions = [];

  return {
    list: function () {
      return extensions.slice();
    },
    install: function (manifest) {
      const record = Object.assign({}, manifest, {
        enabled: false,
        installedAt: Date.now()
      });
      deps.database.provisionExtensionDatabase(record);
      extensions.push(record);
      deps.eventBus.emit('extension.install', record);
      return record;
    },
    enable: function (extensionId) {
      const extension = extensions.find(function (item) { return item.id === extensionId; });
      if (extension) {
        extension.enabled = true;
        deps.eventBus.emit('extension.enabled', extension);
      }
      return extension || null;
    },
    disable: function (extensionId) {
      const extension = extensions.find(function (item) { return item.id === extensionId; });
      if (extension) {
        extension.enabled = false;
        deps.eventBus.emit('extension.disabled', extension);
      }
      return extension || null;
    },
    uninstall: function (extensionId) {
      const index = extensions.findIndex(function (item) { return item.id === extensionId; });
      if (index >= 0) {
        extensions.splice(index, 1);
      }
      deps.database.wipeExtensionData(extensionId);
      deps.eventBus.emit('extension.uninstalled', { extensionId: extensionId });
      return { ok: true, extensionId: extensionId };
    }
  };
};
