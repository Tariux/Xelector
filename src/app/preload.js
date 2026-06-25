const { contextBridge, ipcRenderer } = require('electron');

function invoke(channel, payload) {
  return ipcRenderer.invoke(channel, payload || {});
}

contextBridge.exposeInMainWorld('browserAPI', {
  app: {
    getStatus: function () {
      return invoke('app:getStatus');
    }
  },
  settings: {
    listGlobal: function (namespace) {
      return invoke('settings:listGlobal', { namespace: namespace });
    },
    setGlobal: function (namespace, key, value) {
      return invoke('settings:setGlobal', { namespace: namespace, key: key, value: value });
    },
    listSiteRules: function (namespace) {
      return invoke('settings:listSiteRules', { namespace: namespace });
    },
    saveSiteRule: function (rule) {
      return invoke('settings:saveSiteRule', rule);
    },
    getEffective: function (options) {
      return invoke('settings:getEffective', options);
    }
  },
  profiles: {
    list: function () {
      return invoke('profiles:list');
    },
    save: function (profile) {
      return invoke('profiles:save', profile);
    },
    resolveForUrl: function (url) {
      return invoke('profiles:resolveForUrl', { url: url });
    }
  },
  extraction: {
    runForActiveTab: function (options) {
      return invoke('extraction:runForTab', options || {});
    }
  },
  extensions: {
    list: function () {
      return invoke('extensions:list');
    }
  }
});
